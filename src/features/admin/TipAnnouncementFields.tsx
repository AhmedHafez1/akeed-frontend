'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  getLocaleDirection,
  getLocaleNativeName,
  resolveSupportedLocale,
} from '@/shared/lib/locale'
import { Button, Input, Switch } from '@/shared/ui'
import { getTipEmailPreview, stopTipEmail } from './adminTipsApi'
import {
  TIP_LOCALES,
  type AdminTipCampaign,
  type TipForm,
  type TipFormIssues,
} from './admin-tips.model'
import { TemplateConfirmDialog, templateFieldClass } from './TemplateWriteUi'
import { TipsErrorNotice, useTipsFormat } from './TipsAdminUi'
import { useResource, useTemplateAction } from './useAdminTemplateDrafts'

const placeholders = ['storeName', 'planLine', 'dashboardLink', 'guideLink']
const samples = ['starter', 'basic', 'pro', 'business', 'prepaid'] as const

function LanguageTabs({
  locale,
  onChange,
}: {
  locale: string
  onChange: (locale: string) => void
}) {
  const t = useTranslations('adminAnnouncements')
  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex flex-wrap gap-2"
    >
      {TIP_LOCALES.map((candidate) => (
        <Button
          key={candidate}
          type="button"
          aria-pressed={locale === candidate}
          variant={locale === candidate ? 'default' : 'outline'}
          onClick={() => onChange(candidate)}
        >
          {getLocaleNativeName(resolveSupportedLocale(candidate))}
        </Button>
      ))}
    </div>
  )
}

export function TipAnnouncementFields({
  form,
  onChange,
  readOnly,
  secondaryReadOnly,
  issues = {},
}: {
  form: TipForm
  onChange: (form: TipForm) => void
  readOnly: boolean
  secondaryReadOnly: boolean
  issues?: TipFormIssues
}) {
  const t = useTranslations('adminAnnouncements')
  const [locale, setLocale] = useState('en')
  const email = form.email
  const content = email?.translations.find((row) => row.locale === locale)
  const update = (field: 'subject' | 'body', value: string) => {
    const next = {
      locale,
      subject: content?.subject ?? '',
      body: content?.body ?? '',
      [field]: value,
    }
    const translations = [
      ...(email?.translations ?? []).filter((row) => row.locale !== locale),
      next,
    ].filter((row) => row.locale === 'en' || row.subject || row.body)
    onChange({ ...form, email: { translations } })
  }
  const invalid = content?.body
    .replace(/\{([a-zA-Z]+)\}/g, (match, key: string) =>
      placeholders.includes(key) ? '' : match
    )
    .match(/[{}]/)
  return (
    <section className="border-border bg-card space-y-5 rounded-xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-sm">{t('optional')}</p>
        </div>
        <Switch
          checked={!!email}
          disabled={readOnly}
          label={t('included')}
          onChange={(included) =>
            onChange({
              ...form,
              email: included
                ? { translations: [{ locale: 'en', subject: '', body: '' }] }
                : null,
            })
          }
        />
      </div>
      {readOnly && email && (
        <p className="text-muted-foreground text-sm">{t('frozen')}</p>
      )}
      {Object.keys(issues)
        .filter((key) => key === 'email' || key.startsWith('email.'))
        .map((key) => (
          <p key={key} role="alert" className="text-destructive text-sm">
            {key.includes('.')
              ? getLocaleNativeName(resolveSupportedLocale(key.split('.')[1])) +
                ': '
              : ''}
            {t('invalid')}
          </p>
        ))}
      {(email || form.secondaryAction) && (
        <LanguageTabs locale={locale} onChange={setLocale} />
      )}
      {email && (
        <fieldset
          disabled={readOnly}
          className="space-y-4"
          lang={locale}
          dir={getLocaleDirection(resolveSupportedLocale(locale))}
        >
          {!content && (
            <p className="text-muted-foreground text-sm">{t('noEmail')}</p>
          )}
          <label className="block space-y-2">
            <span>{t('subject')}</span>
            <Input
              value={content?.subject ?? ''}
              maxLength={200}
              onChange={(event) => update('subject', event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span>{t('body')}</span>
            <textarea
              value={content?.body ?? ''}
              maxLength={12000}
              rows={12}
              aria-invalid={!!invalid}
              className={templateFieldClass}
              onChange={(event) => update('body', event.target.value)}
            />
          </label>
          {invalid && (
            <p role="alert" className="text-destructive text-sm">
              {t('unknown')}
            </p>
          )}
          <p className="text-muted-foreground text-sm">{t('supported')}</p>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {placeholders.map((key) => (
              <code key={key} className="bg-muted rounded px-2 py-1 text-xs">
                {'{' + key + '}'}
              </code>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">{t('missing')}</p>
        </fieldset>
      )}
      <fieldset
        disabled={secondaryReadOnly}
        className="space-y-3 border-t pt-4"
      >
        <label className="block space-y-2">
          <span>{t('secondary')}</span>
          <select
            className={templateFieldClass}
            value={form.secondaryAction ? 'guide' : ''}
            onChange={(event) =>
              onChange({
                ...form,
                secondaryAction: event.target.value
                  ? {
                      action: {
                        kind: 'internal',
                        route: 'guide_own_whatsapp_number',
                      },
                      labels: { en: t('guide') },
                    }
                  : null,
              })
            }
          >
            <option value="">{t('none')}</option>
            <option value="guide">{t('guide')}</option>
          </select>
        </label>
        {form.secondaryAction && (
          <label className="block space-y-2">
            <span>
              {t('secondaryLabel')} ·{' '}
              {getLocaleNativeName(resolveSupportedLocale(locale))}
            </span>
            <Input
              maxLength={30}
              lang={locale}
              dir={getLocaleDirection(resolveSupportedLocale(locale))}
              value={form.secondaryAction.labels[locale] ?? ''}
              onChange={(event) =>
                onChange({
                  ...form,
                  secondaryAction: {
                    ...form.secondaryAction!,
                    labels: {
                      ...form.secondaryAction!.labels,
                      [locale]: event.target.value,
                    },
                  },
                })
              }
            />
          </label>
        )}
      </fieldset>
    </section>
  )
}

export function TipEmailPreview({ campaign }: { campaign: AdminTipCampaign }) {
  const t = useTranslations('adminAnnouncements')
  const [locale, setLocale] = useState('en')
  const [sample, setSample] = useState<(typeof samples)[number]>('basic')
  const load = useCallback(
    () => getTipEmailPreview(campaign.id, locale, sample),
    [campaign.id, locale, sample]
  )
  const preview = useResource(
    'Announcement email preview failed',
    `${campaign.id}:${campaign.revision}:${locale}:${sample}`,
    load
  )
  return (
    <section className="border-border bg-card min-w-0 space-y-4 rounded-xl border p-5">
      <h3 className="text-foreground font-semibold">{t('preview')}</h3>
      <LanguageTabs locale={locale} onChange={setLocale} />
      <label className="block space-y-2">
        <span>{t('sample')}</span>
        <select
          className={templateFieldClass}
          value={sample}
          onChange={(event) => setSample(event.target.value as typeof sample)}
        >
          {samples.map((value) => (
            <option key={value} value={value}>
              {t(value)}
            </option>
          ))}
        </select>
      </label>
      {preview.loading && <p role="status">{t('loading')}</p>}
      {preview.error && (
        <TipsErrorNotice error={preview.error} onRetry={preview.refresh} />
      )}
      {preview.data && (
        <div
          lang={preview.data.locale}
          dir={getLocaleDirection(resolveSupportedLocale(preview.data.locale))}
        >
          <h4 className="text-foreground mb-3 font-semibold">
            {preview.data.subject}
          </h4>
          {preview.data.html && (
            <div inert>
              <iframe
                title={t('preview')}
                srcDoc={preview.data.html}
                sandbox=""
                referrerPolicy="no-referrer"
                tabIndex={-1}
                className="border-border h-[600px] w-full rounded-lg border"
              />
            </div>
          )}
          {preview.data.missing && <p role="alert">{t('invalid')}</p>}
        </div>
      )}
      {!campaign.email_enabled && (
        <p className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-lg border p-3 text-sm">
          {t('disabled')}
        </p>
      )}
    </section>
  )
}

export function TipEmailDelivery({
  campaign,
  onChanged,
}: {
  campaign: AdminTipCampaign
  onChanged: () => void
}) {
  const t = useTranslations('adminAnnouncements')
  const format = useTipsFormat()
  const [confirming, setConfirming] = useState(false)
  const action = useTemplateAction<AdminTipCampaign>('Announcement stop failed')
  const stats = campaign.email_stats
  const reasonLabel = (reason: string) =>
    reason === 'no_recipient'
      ? t('noRecipient')
      : reason === 'unsubscribed'
        ? t('unsubscribed')
        : reason === 'inactive'
          ? t('inactive')
          : reason === 'stopped'
            ? t('stoppedReason')
            : reason.startsWith('missing_')
              ? t('missingValue')
              : t('providerFailure')
  return (
    <section className="border-border bg-card space-y-5 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-lg font-semibold">
          {t('delivery')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onChanged}>
            {t('refresh')}
          </Button>
          <Button
            variant="destructive"
            disabled={!!campaign.email_stopped_at || action.pending}
            onClick={() => setConfirming(true)}
          >
            {t('stop')}
          </Button>
        </div>
      </div>
      {campaign.email_stopped_at ? (
        <p role="status">{t('stopped')}</p>
      ) : (
        !campaign.email_enabled && (
          <p role="status" className="text-warning-subtle-foreground">
            {t('disabled')}
          </p>
        )
      )}
      {action.error && <TipsErrorNotice error={action.error} />}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['pending', 'processing', 'sent', 'skipped', 'failed'] as const).map(
          (status) => (
            <div key={status} className="border-border rounded-lg border p-3">
              <dt className="text-muted-foreground text-sm">{t(status)}</dt>
              <dd className="text-foreground text-2xl font-semibold tabular-nums">
                {format.count(stats?.[status] ?? 0)}
              </dd>
            </div>
          )
        )}
      </dl>
      <h3 className="font-semibold">{t('reasons')}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th scope="col" className="text-start">
              {t('reason')}
            </th>
            <th scope="col" className="text-end">
              {t('organizations')}
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats?.reasons ?? {}).map(([reason, count]) => (
            <tr key={reason}>
              <td className="py-2">
                {reasonLabel(reason)}{' '}
                <code className="text-muted-foreground text-xs break-all">
                  {reason}
                </code>
              </td>
              <td className="text-end tabular-nums">{format.count(count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-muted-foreground text-sm">{t('accepted')}</p>
      <TemplateConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('confirmStop')}
        description={t('stopBody')}
        confirmLabel={t('stop')}
        destructive
        pending={action.pending}
        onConfirm={() => {
          void action
            .run(() => stopTipEmail(campaign.id))
            .then((result) => {
              if (result) {
                setConfirming(false)
                onChanged()
              }
            })
        }}
      />
    </section>
  )
}
