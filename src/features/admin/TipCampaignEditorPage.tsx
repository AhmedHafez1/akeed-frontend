'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button } from '@/shared/ui'
import {
  changeTipLifecycle,
  createTipCampaign,
  publishTipCampaign,
  reviewTipCampaign,
  updateTipCampaign,
} from './adminTipsApi'
import {
  emptyTipForm,
  tipContentPayload,
  tipDraftPayload,
  tipFormFromCampaign,
  tipIssuesFromApi,
  validateTipForm,
  type AdminTipCampaign,
  type AdminTipReview,
  type TipForm,
  type TipFormIssues,
} from './admin-tips.model'
import { TipAudienceFields } from './TipAudienceFields'
import { TipContentFields } from './TipContentFields'
import { TipRecipientsList, TipReviewPanel } from './TipReviewPanel'
import { TipStatusBadge, TipsErrorNotice, useTipsFormat } from './TipsAdminUi'
import { useTemplateAction } from './useAdminTemplateDrafts'
import { useTipCampaign, useTipOptions } from './useAdminTips'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-card space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-foreground text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

interface TipCampaignEditorProps {
  campaign: AdminTipCampaign | null
  onChanged: () => void
}

function TipCampaignEditor({ campaign, onChanged }: TipCampaignEditorProps) {
  const t = useTranslations('adminTips')
  const router = useRouter()
  const { locale } = useLocaleInfo()
  const format = useTipsFormat()
  const options = useTipOptions()
  const initial = useMemo(
    () => (campaign ? tipFormFromCampaign(campaign) : emptyTipForm()),
    [campaign]
  )
  const [form, setForm] = useState<TipForm>(initial)
  // Field findings appear after the first save attempt, then follow every edit.
  const [attempted, setAttempted] = useState(false)
  const [review, setReview] = useState<AdminTipReview | null>(null)
  const save = useTemplateAction<AdminTipCampaign>('Tips campaign save failed')
  const reviewAction = useTemplateAction<AdminTipReview>(
    'Tips campaign review failed'
  )
  const publish = useTemplateAction<AdminTipCampaign>(
    'Tips campaign publish failed'
  )
  const lifecycle = useTemplateAction<AdminTipCampaign>(
    'Tips campaign lifecycle failed'
  )

  const status = campaign?.status ?? 'draft'
  const isDraft = status === 'draft'
  const readOnly = status === 'archived'
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const onSave = async () => {
    setAttempted(true)
    const found = validateTipForm(form, { checkExpiry: isDraft })
    if (Object.keys(found).length) return
    const saved = await save.run(() =>
      campaign
        ? updateTipCampaign(campaign.id, {
            revision: campaign.revision,
            ...(isDraft ? tipDraftPayload(form) : tipContentPayload(form)),
          })
        : createTipCampaign(tipDraftPayload(form))
    )
    if (!saved) return
    setReview(null)
    if (!campaign) router.replace(`/${locale}/admin/tips/${saved.id}`)
    else onChanged()
  }

  const apiIssues =
    save.error?.code === 'TIPS_CAMPAIGN_INVALID'
      ? tipIssuesFromApi(save.error.details)
      : {}
  const liveIssues: TipFormIssues = attempted
    ? validateTipForm(form, { checkExpiry: isDraft })
    : {}
  const shownIssues = { ...apiIssues, ...liveIssues }

  // A refused save no longer applies once the form changes.
  const onFormChange = (next: TipForm) => {
    setForm(next)
    if (save.error) save.reset()
  }

  const onReview = async () => {
    if (!campaign) return
    const result = await reviewAction.run(() => reviewTipCampaign(campaign.id))
    if (result) setReview(result)
  }

  const onPublish = async (token: string) => {
    if (!campaign) return
    const published = await publish.run(() =>
      publishTipCampaign(campaign.id, token)
    )
    // A refused publish needs a fresh review; a published one reloads.
    setReview(null)
    if (published) onChanged()
  }

  const onLifecycle = async (action: 'pause' | 'resume' | 'archive') => {
    if (!campaign) return
    const changed = await lifecycle.run(() =>
      changeTipLifecycle(campaign.id, action)
    )
    if (changed) onChanged()
  }

  const effective = campaign?.effective_status ?? 'draft'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost">
          <Link href={`/${locale}/admin/tips`}>
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t('editor.back')}
          </Link>
        </Button>
      </div>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-foreground text-2xl font-semibold">
          {campaign ? campaign.name : t('editor.newTitle')}
        </h1>
        {campaign && <TipStatusBadge status={effective} />}
      </header>
      {campaign && !isDraft && (
        <p className="text-muted-foreground text-sm">
          {readOnly ? t('editor.archivedNote') : t('editor.publishedNote')}
        </p>
      )}

      {options.error && (
        <TipsErrorNotice error={options.error} onRetry={options.refresh} />
      )}

      <Section
        title={t('editor.contentTitle')}
        description={t('editor.contentDescription')}
      >
        <TipContentFields
          form={form}
          onChange={onFormChange}
          issues={shownIssues}
          options={options.data}
          readOnly={readOnly}
          expiryLocked={!isDraft}
        />
      </Section>

      <Section
        title={t('audience.title')}
        description={
          isDraft ? t('audience.description') : t('audience.lockedDescription')
        }
      >
        <TipAudienceFields
          form={form}
          onChange={onFormChange}
          issues={shownIssues}
          options={options.data}
          campaignId={campaign?.id ?? null}
          revision={campaign?.revision ?? 0}
          locked={!isDraft}
        />
      </Section>

      {!readOnly && (
        <div className="border-border bg-card/95 sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border p-4 backdrop-blur">
          {Object.keys(shownIssues).length > 0 && (
            <p role="alert" className="text-destructive text-sm">
              {t('editor.fixErrors')}
            </p>
          )}
          {save.error && save.error.code !== 'TIPS_CAMPAIGN_INVALID' && (
            <TipsErrorNotice error={save.error} className="w-full" />
          )}
          <span className="text-muted-foreground ms-auto text-xs">
            {dirty ? t('editor.unsaved') : campaign ? t('editor.saved') : ''}
          </span>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={save.pending || (!dirty && !!campaign)}
          >
            {save.pending
              ? t('editor.saving')
              : campaign
                ? t('editor.save')
                : t('editor.createDraft')}
          </Button>
        </div>
      )}

      {campaign && isDraft && (
        <TipReviewPanel
          campaign={campaign}
          review={review}
          dirty={dirty}
          reviewing={reviewAction.pending}
          publishing={publish.pending}
          error={reviewAction.error ?? publish.error}
          onReview={() => void onReview()}
          onPublish={(token) => void onPublish(token)}
        />
      )}

      {campaign && !isDraft && (
        <>
          <Section
            title={t('analytics.title')}
            description={
              campaign.action ? undefined : t('analytics.noButtonNote')
            }
          >
            <dl className="grid gap-4 sm:grid-cols-4">
              {(['recipients', 'viewed', 'clicked', 'dismissed'] as const).map(
                (key) => (
                  <div
                    key={key}
                    className="border-border rounded-lg border p-3"
                  >
                    <dt className="text-muted-foreground text-xs">
                      {t(`analytics.${key}`)}
                    </dt>
                    <dd className="text-foreground text-2xl font-semibold tabular-nums">
                      {key === 'clicked' && !campaign.action
                        ? t('analytics.noButton')
                        : format.count(campaign.analytics[key])}
                    </dd>
                  </div>
                )
              )}
            </dl>
            <dl className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="inline">{t('editor.publishedAt')}: </dt>
                <dd className="inline">
                  {format.dateTime(campaign.published_at)}
                </dd>
              </div>
              <div>
                <dt className="inline">{t('editor.expiresAt')}: </dt>
                <dd className="inline">
                  {campaign.expires_at
                    ? format.dateTime(campaign.expires_at)
                    : t('noExpiry')}
                </dd>
              </div>
            </dl>
            {!readOnly && (
              <div className="flex flex-wrap gap-2">
                {campaign.status === 'published' && effective !== 'expired' && (
                  <Button
                    variant="outline"
                    disabled={lifecycle.pending}
                    onClick={() => void onLifecycle('pause')}
                  >
                    {t('actions.pause')}
                  </Button>
                )}
                {campaign.status === 'paused' && effective !== 'expired' && (
                  <Button
                    variant="outline"
                    disabled={lifecycle.pending}
                    onClick={() => void onLifecycle('resume')}
                  >
                    {t('actions.resume')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={lifecycle.pending}
                  onClick={() => void onLifecycle('archive')}
                >
                  {t('actions.archive')}
                </Button>
              </div>
            )}
            {lifecycle.error && <TipsErrorNotice error={lifecycle.error} />}
          </Section>
          <Section title={t('recipients.title')}>
            <TipRecipientsList
              campaignId={campaign.id}
              reloadKey={campaign.revision}
              frozen
            />
          </Section>
        </>
      )}
      {campaign && isDraft && (
        <Section title={t('archiveDraft.title')}>
          <Button
            variant="outline"
            disabled={lifecycle.pending}
            onClick={() => void onLifecycle('archive')}
          >
            {t('actions.archive')}
          </Button>
          {lifecycle.error && <TipsErrorNotice error={lifecycle.error} />}
        </Section>
      )}
    </div>
  )
}

export function TipCampaignNewPage() {
  return <TipCampaignEditor campaign={null} onChanged={() => undefined} />
}

export function TipCampaignEditorPage({ id }: { id: string }) {
  const t = useTranslations('adminTips')
  const resource = useTipCampaign(id)
  if (resource.error) {
    return <TipsErrorNotice error={resource.error} onRetry={resource.refresh} />
  }
  if (!resource.data) {
    return (
      <p className="text-muted-foreground text-sm">{t('editor.loading')}</p>
    )
  }
  // Keyed by revision and status, so a save or a lifecycle change reloads the form.
  return (
    <TipCampaignEditor
      key={`${resource.data.revision}:${resource.data.status}`}
      campaign={resource.data}
      onChanged={resource.refresh}
    />
  )
}
