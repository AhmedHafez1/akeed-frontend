'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { TipCard, resolveTipHref, type TipLink } from '@/features/tips'
import {
  getLocaleNativeName,
  resolveSupportedLocale,
} from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Button, Input } from '@/shared/ui'
import { getTipRecipients } from './adminTipsApi'
import {
  TIP_FALLBACK_LOCALE,
  TIP_LOCALES,
  activeFilterCount,
  organizationLabel,
  type AdminTipCampaign,
  type AdminTipReview,
} from './admin-tips.model'
import type { AdminApiError } from './adminApi'
import { TemplateConfirmDialog } from './TemplateWriteUi'
import { TipsErrorNotice, useTipsFormat } from './TipsAdminUi'
import { useOrganizationPages } from './useAdminTips'

/**
 * The merchant card exactly as the dashboard draws it, in any language. A
 * language without content shows the English fallback, as merchants see it.
 * The preview is inert: it records nothing and its button goes nowhere.
 */
export function TipCardPreview({ campaign }: { campaign: AdminTipCampaign }) {
  const t = useTranslations('adminTips.review')
  const [locale, setLocale] = useState(TIP_FALLBACK_LOCALE)
  const hasAction = campaign.action !== null
  const complete = (
    row: AdminTipCampaign['translations'][number] | undefined
  ) =>
    !!row &&
    !!row.title &&
    !!row.description &&
    (!hasAction || !!row.action_label)
  const requested = campaign.translations.find((row) => row.locale === locale)
  const bundle = complete(requested)
    ? requested
    : campaign.translations.find((row) => row.locale === TIP_FALLBACK_LOCALE)
  if (!bundle) return null

  let link: TipLink | null = null
  if (campaign.action?.kind === 'external' && bundle.action_label)
    link = {
      kind: 'external',
      href: campaign.action.url,
      label: bundle.action_label,
    }
  if (campaign.action?.kind === 'internal' && bundle.action_label) {
    const href = resolveTipHref(campaign.action.route, 'standalone', locale, '')
    link = href ? { kind: 'internal', href, label: bundle.action_label } : null
  }

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label={t('previewLanguage')}
        className="flex flex-wrap gap-1"
      >
        {TIP_LOCALES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={candidate === locale}
            onClick={() => setLocale(candidate)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs',
              candidate === locale
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border text-foreground/70'
            )}
          >
            {getLocaleNativeName(resolveSupportedLocale(candidate))}
          </button>
        ))}
      </div>
      {bundle.locale !== locale && (
        <p className="text-muted-foreground text-xs">
          {t('previewFallback', {
            language: getLocaleNativeName(resolveSupportedLocale(locale)),
          })}
        </p>
      )}
      <div inert className="max-w-xl" data-testid="tip-preview">
        <TipCard
          card={{
            type: campaign.type,
            locale: bundle.locale,
            title: bundle.title,
            description: bundle.description,
          }}
          link={link}
          canDismiss
          onDismiss={() => undefined}
        />
      </div>
    </div>
  )
}

/** A draft's live audience, or a published campaign's frozen recipients. */
export function TipRecipientsList({
  campaignId,
  reloadKey,
  frozen,
}: {
  campaignId: string
  reloadKey: number | string
  frozen: boolean
}) {
  const t = useTranslations('adminTips.recipients')
  const format = useTipsFormat()
  const load = useCallback(
    (params: { search?: string; cursor?: string }) =>
      getTipRecipients(campaignId, params),
    [campaignId]
  )
  const list = useOrganizationPages(load, { reloadKey })
  return (
    <section className="space-y-3">
      <Input
        type="search"
        aria-label={t('search')}
        placeholder={t('search')}
        value={list.search}
        onChange={(event) => list.setSearch(event.target.value)}
      />
      {list.error && <TipsErrorNotice error={list.error} />}
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">{t('caption')}</caption>
          <thead className="bg-muted/60 text-muted-foreground text-xs">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {t('merchant')}
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                {t('platform')}
              </th>
              {frozen ? (
                <>
                  <th scope="col" className="px-3 py-2 text-start font-medium">
                    {t('viewed')}
                  </th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">
                    {t('clicked')}
                  </th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">
                    {t('dismissed')}
                  </th>
                </>
              ) : (
                <th scope="col" className="px-3 py-2 text-start font-medium">
                  {t('state')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {list.items.map((row) => (
              <tr
                key={row.org_id}
                className={cn(row.excluded && 'text-muted-foreground')}
              >
                <td className="px-3 py-2">{organizationLabel(row)}</td>
                <td className="px-3 py-2" dir="ltr">
                  {[row.platform, row.country_code].filter(Boolean).join(' · ')}
                </td>
                {frozen ? (
                  <>
                    <td className="px-3 py-2">
                      {row.first_viewed_at
                        ? format.dateTime(row.first_viewed_at)
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row.first_clicked_at
                        ? format.dateTime(row.first_clicked_at)
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row.dismissed_at
                        ? format.dateTime(row.dismissed_at)
                        : '—'}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2">
                    {row.excluded ? t('excluded') : t('included')}
                  </td>
                )}
              </tr>
            ))}
            {!list.loading && list.items.length === 0 && (
              <tr>
                <td
                  colSpan={frozen ? 5 : 3}
                  className="text-muted-foreground px-3 py-4"
                >
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {list.hasMore && (
        <Button
          type="button"
          variant="outline"
          onClick={list.loadMore}
          disabled={list.loading}
        >
          {t('loadMore')}
        </Button>
      )}
    </section>
  )
}

interface TipReviewPanelProps {
  campaign: AdminTipCampaign
  review: AdminTipReview | null
  dirty: boolean
  reviewing: boolean
  publishing: boolean
  error: AdminApiError | null
  onReview: () => void
  onPublish: (token: string) => void
}

/** Review before publishing: the card, the criteria, the exact recipients. */
export function TipReviewPanel({
  campaign,
  review,
  dirty,
  reviewing,
  publishing,
  error,
  onReview,
  onPublish,
}: TipReviewPanelProps) {
  const t = useTranslations('adminTips.review')
  const format = useTipsFormat()
  const [confirming, setConfirming] = useState(false)
  const current =
    review !== null && review.campaign.revision === campaign.revision

  return (
    <section className="border-border bg-card space-y-5 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>
        <Button type="button" onClick={onReview} disabled={dirty || reviewing}>
          {reviewing
            ? t('reviewing')
            : current
              ? t('reviewAgain')
              : t('review')}
        </Button>
      </div>
      {dirty && <p className="text-warning text-sm">{t('saveFirst')}</p>}
      {error && <TipsErrorNotice error={error} />}

      {current && review && (
        <div className="space-y-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-xs">
                {t('recipients')}
              </dt>
              <dd className="text-foreground text-2xl font-semibold tabular-nums">
                {format.count(review.recipient_count)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">{t('criteria')}</dt>
              <dd>
                {campaign.audience.mode === 'direct'
                  ? t('criteriaDirect', {
                      count: campaign.audience.selected_org_ids.length,
                    })
                  : t('criteriaFilters', {
                      count: activeFilterCount(campaign.audience.filters),
                    })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">
                {t('exclusions')}
              </dt>
              <dd>
                {campaign.audience.mode === 'filters'
                  ? format.count(campaign.audience.excluded_org_ids.length)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">{t('expiry')}</dt>
              <dd>
                {campaign.expires_at
                  ? format.dateTime(campaign.expires_at)
                  : t('noExpiry')}
              </dd>
            </div>
          </dl>
          <TipCardPreview campaign={campaign} />
          <TipRecipientsList
            campaignId={campaign.id}
            reloadKey={review.review_token}
            frozen={false}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={publishing}
            >
              {t('publish')}
            </Button>
          </div>
        </div>
      )}

      <TemplateConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('confirmTitle')}
        description={t('confirmBody', { count: review?.recipient_count ?? 0 })}
        confirmLabel={t('confirmPublish')}
        pending={publishing}
        onConfirm={() => {
          if (review) onPublish(review.review_token)
          setConfirming(false)
        }}
      />
    </section>
  )
}
