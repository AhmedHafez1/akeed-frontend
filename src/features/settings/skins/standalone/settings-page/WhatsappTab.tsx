'use client'

import { useId, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  MessageCircle,
  Minus,
  Pause,
  Unplug,
  X,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useBillingSummary } from '@/features/billing'
import {
  acceptedAtLabel,
  messageLanguageName,
  serverErrorKey,
  useWhatsappTab,
  type AcceptedSend,
  type ConnectionView,
  type TabBanner,
  type TemplateRow,
  type WhatsappTabModel,
} from '@/features/whatsapp-connect'
import { getFormatLocale, resolveSupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  akButton,
  akLink,
  akPill,
  DocsLink,
  InfoHint,
  Skeleton,
} from '@/shared/ui'
import {
  AnnotatedSection,
  AnnotatedSections,
  settingsRowPadding,
  settingsRowTitle,
  SwitchSetting,
} from './SettingsSection'
import { WhatsappDisconnectDialog } from './WhatsappDisconnectDialog'

/**
 * The merchant's own WhatsApp number: connecting it, its readiness now, each
 * template's current sender, the last accepted sends as history, thank-you
 * replies and disconnecting. Every fact comes from the server; nothing here
 * decides readiness on its own.
 */
export function WhatsappTab() {
  const t = useTranslations('whatsappConnect.tab')
  const model = useWhatsappTab()

  if (model.status === 'loading') return <WhatsappTabSkeleton />
  if (model.status === 'error') {
    return (
      <div
        role="alert"
        className={cn(
          'rounded-ak-card border-line bg-card shadow-ak-card border',
          'flex flex-wrap items-end justify-between gap-4',
          settingsRowPadding
        )}
      >
        <div className="min-w-0 space-y-1">
          <h2 className="text-ak-section text-ink">{t('load.title')}</h2>
          <p className="text-ak-body text-ink-muted">{t('load.body')}</p>
        </div>
        <button
          type="button"
          onClick={model.retry}
          className={akButton({ variant: 'secondary', size: 'row' })}
        >
          {t('load.retry')}
        </button>
      </div>
    )
  }

  const view = model.view
  if (view.kind === 'hidden') return null

  return (
    <div className="space-y-6">
      {view.kind === 'connection' &&
        view.banners.map((banner) => (
          <Banner key={banner.key} banner={banner} view={view} />
        ))}
      <AnnotatedSections>
        <AnnotatedSection
          title={t('number.title')}
          description={
            view.kind === 'unconnected' ? t('connect.body') : undefined
          }
        >
          {view.kind === 'unconnected' ? (
            <ConnectPanel model={model} canConnect={view.canConnect} />
          ) : (
            <NumberPanel view={view} model={model} />
          )}
        </AnnotatedSection>
        {view.kind === 'unconnected' && <CostsSection />}
        {view.kind === 'connection' && view.state !== 'disconnected' && (
          <>
            <AnnotatedSection title={t('templates.title')}>
              <TemplatesPanel view={view} />
            </AnnotatedSection>
            <AnnotatedSection title={t('thankYou.title')}>
              <SwitchSetting
                title={t('thankYou.heading')}
                help={t('thankYou.help')}
                checked={view.thankYou.enabled}
                disabled={!view.thankYou.canUpdate || model.thankYou.isSaving}
                onCheckedChange={model.thankYou.set}
              >
                {(!view.thankYou.canUpdate || model.thankYou.error) && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-5">
                    {!view.thankYou.canUpdate && (
                      <p className="text-ak-caption text-ink-muted">
                        {t('thankYou.readOnly')}
                      </p>
                    )}
                    {model.thankYou.error && (
                      <p
                        role="alert"
                        className="text-ak-caption text-ak-danger"
                      >
                        {model.thankYou.error === 'writeRequired'
                          ? t('thankYou.readOnly')
                          : t('thankYou.error')}
                      </p>
                    )}
                  </div>
                )}
              </SwitchSetting>
            </AnnotatedSection>
          </>
        )}
      </AnnotatedSections>
      <p className="text-ak-caption text-ink-muted flex items-center gap-2">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        <DocsLink article="ownWhatsappNumber" className={akLink}>
          {t('help')}
        </DocsLink>
      </p>
    </div>
  )
}

function WhatsappTabSkeleton() {
  return (
    <div
      aria-busy="true"
      className={cn(
        'rounded-ak-card border-line bg-card shadow-ak-card space-y-4 border',
        settingsRowPadding
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

type LineState = 'idle' | 'waiting' | 'connected' | 'disconnected'

/** Akeed on one end, the merchant's number on the other. */
function NumberLine({
  state,
  phone,
}: {
  state: LineState
  phone: string | null
}) {
  const t = useTranslations('whatsappConnect.tab')
  const shown = phone ?? t('number.yourNumber')
  return (
    <div>
      <p className="sr-only">{t(`line.${state}`, { number: shown })}</p>
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="bg-brand text-brand-foreground rounded-ak-control flex size-10 shrink-0 items-center justify-center">
          <Check className="size-5" strokeWidth={3} />
        </span>
        <span className="flex h-6 min-w-8 flex-1 items-center sm:max-w-72">
          {state === 'connected' ? (
            <span className="bg-brand block h-0.5 w-full rounded-full" />
          ) : state === 'disconnected' ? (
            <>
              <span className="border-line flex-1 border-t-2 border-dashed" />
              <span className="bg-muted text-muted-foreground mx-1 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Unplug className="size-3.5" />
              </span>
              <span className="border-line flex-1 border-t-2 border-dashed" />
            </>
          ) : (
            <span
              className={cn(
                'block w-full border-t-2 border-dashed',
                state === 'waiting'
                  ? 'border-brand motion-safe:animate-pulse'
                  : 'border-brand-line'
              )}
            />
          )}
        </span>
        <span
          className={cn(
            'rounded-ak-control flex min-w-0 items-center gap-2 border px-3 py-2 text-[0.9375rem] font-semibold',
            state === 'connected'
              ? 'border-brand-line bg-brand-soft text-brand-ink'
              : state === 'idle'
                ? 'border-line-strong text-ink-muted border-dashed'
                : 'border-line text-ink-muted'
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          {phone ? (
            <bdi dir="ltr" className="truncate tabular-nums">
              {phone}
            </bdi>
          ) : (
            <span className="truncate">{shown}</span>
          )}
        </span>
      </div>
    </div>
  )
}

function ConnectPanel({
  model,
  canConnect,
}: {
  model: WhatsappTabModel
  canConnect: boolean
}) {
  const t = useTranslations('whatsappConnect.tab')
  return (
    <div className={cn('space-y-5', settingsRowPadding)}>
      <NumberLine state="idle" phone={null} />
      <ul className="text-ak-caption text-ink-muted flex flex-wrap gap-x-6 gap-y-2">
        {(['keepApp', 'metaBills'] as const).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <Check aria-hidden="true" className="text-brand-ink size-4" />
            {t(`connect.${key}`)}
          </li>
        ))}
      </ul>
      <div className="border-line border-t pt-5">
        <ConnectAction
          model={model}
          canConnect={canConnect}
          label={t('connect.action')}
          hint={canConnect ? undefined : t('connect.ownerOnly')}
        />
        {!canConnect && <PermissionNote />}
      </div>
    </div>
  )
}

function ConnectAction({
  model,
  canConnect,
  label,
  hint,
}: {
  model: WhatsappTabModel
  canConnect: boolean
  label: string
  hint?: string
}) {
  const t = useTranslations('whatsappConnect')
  const hintId = useId()
  const { entry } = model
  const opening = entry.status === 'opening'
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={entry.open}
          disabled={!canConnect || opening}
          aria-describedby={hint ? hintId : undefined}
          className={akButton({ variant: 'primary', size: 'md' })}
        >
          {opening ? (
            <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
          ) : (
            <ExternalLink aria-hidden="true" className="rtl:-scale-x-100" />
          )}
          {opening ? t('tab.connect.opening') : label}
        </button>
        {hint && (
          <p id={hintId} className="text-ak-caption text-ink-muted">
            {hint}
          </p>
        )}
      </div>
      <div role="status" aria-live="polite" className="text-ak-caption">
        {entry.status === 'opened' && (
          <p className="text-ink-muted">{t('tab.connect.opened')}</p>
        )}
        {entry.status === 'blocked' && entry.pendingUrl && (
          <p className="text-ink-muted">
            {t('card.blocked')}{' '}
            <a
              href={entry.pendingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={akLink}
            >
              {t('card.openLink')}
            </a>
          </p>
        )}
        {entry.status === 'failed' && (
          <p className="text-ak-danger font-semibold">
            {t(`errors.${serverErrorKey(entry.errorCode)}`)}
          </p>
        )}
      </div>
    </div>
  )
}

function PermissionNote() {
  const t = useTranslations('whatsappConnect.tab.permissions')
  return (
    <div className="bg-neutral-soft rounded-ak-control mt-4 px-4 py-3">
      <p className="text-ak-body text-ink flex items-center gap-1 font-semibold">
        {t('title')}
        <InfoHint label={t('title')} content={t('body')} />
      </p>
    </div>
  )
}

function CostsSection() {
  const t = useTranslations('whatsappConnect.tab.costs')
  const { summary } = useBillingSummary()
  const akeed = summary?.price.creditsPerMessage
  const own = summary?.price.ownNumberCreditsPerMessage
  // Rates only from the server; without both there is nothing to compare.
  if (akeed === undefined || own === undefined) return null
  return (
    <AnnotatedSection title={t('title')}>
      <div className={settingsRowPadding}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Rate label={t('fromAkeed')} value={t('credits', { count: akeed })} />
          <Rate label={t('fromYours')} value={t('credits', { count: own })} />
        </dl>
      </div>
    </AnnotatedSection>
  )
}

function Rate({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-ak-caption text-ink-muted">{label}</dt>
      <dd className="text-ink text-[1.0625rem] font-semibold">{value}</dd>
    </div>
  )
}

const BADGE = {
  connected: { tone: 'brand', Icon: Check },
  preparing: { tone: 'info', Icon: Clock },
  disconnected: { tone: 'danger', Icon: AlertTriangle },
} as const

function NumberPanel({
  view,
  model,
}: {
  view: ConnectionView
  model: WhatsappTabModel
}) {
  const t = useTranslations('whatsappConnect.tab')
  const [confirming, setConfirming] = useState(false)
  const badge = BADGE[view.badge]
  const result = model.disconnect.result
  const lineState: LineState =
    view.badge === 'connected'
      ? 'connected'
      : view.badge === 'preparing'
        ? 'waiting'
        : 'disconnected'

  return (
    <div>
      <div className={cn('space-y-5', settingsRowPadding)}>
        <NumberLine state={lineState} phone={view.phone} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-ink text-[1.0625rem] font-semibold">
              {view.phone ? (
                <bdi dir="ltr" className="tabular-nums">
                  {view.phone}
                </bdi>
              ) : (
                t('number.noNumber')
              )}
            </p>
            <p className="text-ak-caption text-ink-muted mt-0.5">
              {t(`number.subtitle.${view.signupPath}`)}
            </p>
          </div>
          <span className={akPill({ tone: badge.tone })}>
            <badge.Icon aria-hidden="true" className="size-3.5" />
            {t(`status.${view.badge}`)}
          </span>
        </div>
      </div>

      {view.canReconnect ? (
        <ReconnectPanel model={model} />
      ) : (
        <dl className="border-line grid gap-4 border-t sm:grid-cols-2 [&>div]:px-4 [&>div]:py-4 sm:[&>div]:px-6">
          <Fact label={t('readiness.label')}>
            {t(`readiness.${view.readiness}`)}
          </Fact>
          <Fact
            label={t('last.confirmation')}
            help={
              view.lastConfirmation || view.lastReminder
                ? t('last.historical')
                : undefined
            }
          >
            {view.lastConfirmation ? (
              <LastSend send={view.lastConfirmation} />
            ) : (
              t('last.noConfirmation')
            )}
            {view.lastReminder && (
              <span className="text-ak-caption text-ink-muted mt-1 block font-normal">
                {t('last.reminder')}: <LastSend send={view.lastReminder} />
              </span>
            )}
          </Fact>
        </dl>
      )}

      {result && view.state === 'disconnected' && <DisconnectResult />}

      {view.state !== 'disconnected' && (
        <div
          className={cn(
            'border-line flex flex-wrap items-center gap-x-4 gap-y-2 border-t',
            settingsRowPadding
          )}
        >
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!view.canDisconnect || model.disconnect.isPending}
            className={akButton({ variant: 'secondary', size: 'row' })}
          >
            <Unplug aria-hidden="true" />
            {t('disconnect.action')}
          </button>
          {!view.canDisconnect && (
            <p className="text-ak-caption text-ink-muted">
              {t('connect.ownerOnly')}
            </p>
          )}
        </div>
      )}

      <WhatsappDisconnectDialog
        open={confirming}
        coexistence={view.signupPath === 'coexistence'}
        isPending={model.disconnect.isPending}
        error={model.disconnect.error}
        onDismiss={() => {
          setConfirming(false)
          model.disconnect.clearError()
        }}
        onConfirm={async () => {
          if (await model.disconnect.run()) setConfirming(false)
        }}
      />
    </div>
  )

  function DisconnectResult() {
    if (!result) return null
    return (
      <div
        role="status"
        className={cn('border-line space-y-3 border-t', settingsRowPadding)}
      >
        <p className="text-ak-body text-ink font-semibold">
          {t('disconnect.done')}
        </p>
        {result.businessAppSteps.length > 0 && (
          <div className="bg-ak-warning-soft text-ak-warning border-ak-warning-line rounded-ak-control border px-4 py-3">
            <p className="text-ak-body">{t('disconnect.appStepsIntro')}</p>
            <ol className="text-ak-body mt-2 list-decimal space-y-1 ps-5">
              {result.businessAppSteps.map((step) => (
                <li key={step}>
                  {t.has(`disconnect.appSteps.${step}`)
                    ? t(`disconnect.appSteps.${step}`)
                    : step}
                </li>
              ))}
            </ol>
          </div>
        )}
        {result.providerCleanup === 'manual_required' && (
          <p className="text-ak-caption text-ink-muted">
            {t('disconnect.cleanupManual')}
          </p>
        )}
      </div>
    )
  }
}

function Fact({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-ak-caption text-ink-muted flex items-center gap-1">
        {label}
        {help && <InfoHint label={label} content={help} />}
      </dt>
      <dd className="text-ak-body text-ink mt-1 font-semibold">{children}</dd>
    </div>
  )
}

function LastSend({ send }: { send: AcceptedSend }) {
  const t = useTranslations('whatsappConnect.tab')
  const formatLocale = getFormatLocale(useLocale())
  return (
    <>
      {t('last.value', {
        sender:
          send.kind === 'merchant_own'
            ? t('sender.yourNumber')
            : t('sender.akeed'),
        time: acceptedAtLabel(send, formatLocale),
      })}
      {send.deliveryStatus !== 'accepted' && (
        <span className="text-ink-muted font-normal">
          {' · '}
          {t(`last.delivery.${send.deliveryStatus}`)}
        </span>
      )}
    </>
  )
}

function ReconnectPanel({ model }: { model: WhatsappTabModel }) {
  const t = useTranslations('whatsappConnect.tab.reconnect')
  return (
    <div className={cn('border-line space-y-4 border-t', settingsRowPadding)}>
      <div className="space-y-1">
        <h3 className={settingsRowTitle}>{t('title')}</h3>
        <p className="text-ak-body text-ink-muted">{t('body')}</p>
      </div>
      <ConnectAction model={model} canConnect label={t('action')} />
    </div>
  )
}

const STATUS_PILL = {
  approved: { tone: 'brand', Icon: Check },
  pending: { tone: 'warning', Icon: Clock },
  rejected: { tone: 'danger', Icon: X },
  paused: { tone: 'warning', Icon: Pause },
  recategorized: { tone: 'warning', Icon: AlertTriangle },
  missing: { tone: 'neutral', Icon: Minus },
} as const

function TemplatesPanel({ view }: { view: ConnectionView }) {
  const t = useTranslations('whatsappConnect.tab.templates')
  const locale = resolveSupportedLocale(useLocale())
  const rows = view.templates
  const approved = rows.filter((row) => row.status === 'approved').length
  const allApproved = rows.length > 0 && approved === rows.length
  const footer =
    view.readiness === 'ready'
      ? 'ready'
      : view.readiness.startsWith('degraded') && allApproved
        ? 'degraded'
        : rows.some((row) => row.status === 'pending')
          ? 'pending'
          : 'akeed'

  return (
    <div>
      <div
        className={cn(
          'flex flex-wrap items-start justify-between gap-3',
          settingsRowPadding
        )}
      >
        <div className="flex min-w-0 items-center gap-1">
          <h3 className={settingsRowTitle}>{t('title')}</h3>
          {footer === 'akeed' && (
            <InfoHint label={t('title')} content={t('footer.akeed')} />
          )}
        </div>
        {rows.length > 0 && (
          <span className={akPill({ tone: allApproved ? 'brand' : 'warning' })}>
            {allApproved ? (
              <Check aria-hidden="true" className="size-3.5" />
            ) : (
              <Clock aria-hidden="true" className="size-3.5" />
            )}
            {t('approvedCount', { approved, total: rows.length })}
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className={cn('text-ak-body text-ink-muted', settingsRowPadding)}>
          {t('empty')}
        </p>
      ) : (
        <div className="overflow-x-auto px-4 sm:px-6">
          <table className="w-full min-w-136 text-start">
            <caption className="sr-only">{t('tableLabel')}</caption>
            <thead>
              <tr className="bg-surface-sunken text-ak-caption text-ink-muted">
                {(['language', 'message', 'status', 'sender'] as const).map(
                  (column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-3 py-2.5 text-start font-semibold first:rounded-s-md last:rounded-e-md"
                    >
                      {t(`columns.${column}`)}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <TemplateRowView key={row.key} row={row} locale={locale} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && (footer === 'pending' || footer === 'degraded') && (
        <p
          className={cn(
            'text-ak-caption text-ink-muted border-line mt-2 flex items-start gap-2 border-t',
            settingsRowPadding
          )}
        >
          {footer === 'degraded' ? (
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
          ) : (
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          {t(`footer.${footer}`)}
        </p>
      )}
    </div>
  )
}

function TemplateRowView({
  row,
  locale,
}: {
  row: TemplateRow
  locale: ReturnType<typeof resolveSupportedLocale>
}) {
  const t = useTranslations('whatsappConnect.tab')
  const pill = STATUS_PILL[row.status]
  // A template-specific reason is already the status; only a number-wide one
  // (setup, degradation, switch, disconnect) is added beside the sender.
  const extraReason =
    row.reason && !row.reason.startsWith('template') ? row.reason : null
  return (
    <tr className="border-line text-ak-body border-b last:border-b-0">
      <th
        scope="row"
        className="text-ink px-3 py-3.5 text-start font-semibold whitespace-nowrap"
      >
        {messageLanguageName(row.language, locale)}
      </th>
      <td className="text-ink px-3 py-3.5 whitespace-nowrap">
        {t(`templates.message.${row.message}`)}
      </td>
      <td className="px-3 py-3.5">
        <span className={akPill({ tone: pill.tone })}>
          <pill.Icon aria-hidden="true" className="size-3.5" />
          {t(`templates.status.${row.status}`)}
        </span>
      </td>
      <td className="text-ink px-3 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          {row.sender === 'yourNumber' ? (
            <Check aria-hidden="true" className="text-brand-ink size-4" />
          ) : (
            <MessageCircle
              aria-hidden="true"
              className="text-ink-muted size-4"
            />
          )}
          {t(`sender.${row.sender}`)}
          {extraReason && (
            <span className="text-ak-caption text-ink-muted">
              {' · '}
              {t(`templates.reason.${extraReason}`)}
            </span>
          )}
        </span>
      </td>
    </tr>
  )
}

const BANNER_TONE = {
  // The approved boards show sender problems in amber; urgency is in the
  // words and the alert role, not a red fill.
  critical: 'border-ak-warning-line bg-ak-warning-soft text-ak-warning',
  warning: 'border-ak-warning-line bg-ak-warning-soft text-ak-warning',
  info: 'border-ak-info/30 bg-ak-info-soft text-ak-info',
} as const

function Banner({ banner, view }: { banner: TabBanner; view: ConnectionView }) {
  const t = useTranslations('whatsappConnect.tab')
  const locale = resolveSupportedLocale(useLocale())
  const templates = banner.templates
    .map((template) =>
      t('banners.templateItem', {
        language: messageLanguageName(template.language, locale),
        message: t(`templates.message.${template.message}`),
      })
    )
    .join(t('banners.templateSeparator'))
  const Icon = banner.tone === 'info' ? Info : AlertTriangle
  return (
    <div
      role={banner.tone === 'critical' ? 'alert' : 'status'}
      className={cn(
        'text-ak-body rounded-ak-card flex items-start gap-3 border px-4 py-3',
        BANNER_TONE[banner.tone]
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold">{t(`banners.${banner.key}.title`)}</p>
        <p>
          {t(`banners.${banner.key}.body`, { templates })}
          {banner.resumes && <> {t('banners.resumes')}</>}
        </p>
        {banner.action === 'reconnect' && !view.canReconnect && (
          <p>
            {view.isOwner ? t('banners.reconnectFirst') : t('banners.askOwner')}
          </p>
        )}
      </div>
    </div>
  )
}
