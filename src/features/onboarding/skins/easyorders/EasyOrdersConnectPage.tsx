'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  AlertCircle,
  Check,
  Clock,
  Eye,
  Link2,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  LoadingButton,
  Skeleton,
  StatusBadge,
  akCard,
} from '@/shared/ui'
import {
  toEasyOrdersErrorKey,
  type EasyOrdersConnectView,
} from './easyOrders.types'
import { useEasyOrdersConnection } from './useEasyOrdersConnection'
import { OrderSettingsForm } from './OrderSettingsForm'
import { WebhookSecretsForm } from './WebhookSecretsForm'

const PERMISSIONS = ['read', 'update'] as const

/**
 * Connecting an EasyOrders store: connect, waiting, not completed, error and
 * connected, one at a time. The install link, the API key and the webhook
 * secrets never appear on this screen.
 */
export function EasyOrdersConnectPage() {
  const t = useTranslations('easyOrdersConnect')
  const locale = useLocale() === 'en' ? 'en' : 'ar'
  const connection = useEasyOrdersConnection(locale)
  const { view, status, canManage } = connection
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownViewRef = useRef<EasyOrdersConnectView | null>(null)

  // Land keyboard and screen-reader users on each new state, not on load.
  useEffect(() => {
    if (view === 'loading') return
    if (shownViewRef.current !== null && shownViewRef.current !== view) {
      headingRef.current?.focus()
    }
    shownViewRef.current = view
  }, [view])

  if (view === 'loading') {
    return (
      <Frame>
        <div aria-busy="true" className={cn(akCard, 'space-y-4 p-6 sm:p-8')}>
          <span className="sr-only">{t('loading')}</span>
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-5 w-[28rem] max-w-full" />
          <Skeleton className="rounded-panel h-40 w-full" />
        </div>
      </Frame>
    )
  }

  const store = status?.organizationName?.trim() || null
  const heading = (text: ReactNode) => (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className="text-ink text-h3 font-bold focus-visible:outline-none"
    >
      {text}
    </h1>
  )
  const connectButton = (label: string) => (
    <LoadingButton
      size="lg"
      className="w-full gap-2 px-8 font-semibold sm:w-auto"
      disabled={!canManage}
      loading={connection.isStarting}
      loadingText={t('connect.starting')}
      onClick={() => void connection.connect()}
    >
      <Link2 aria-hidden="true" />
      {label}
    </LoadingButton>
  )
  const startError = connection.startErrorCode && (
    <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
      {t(`error.codes.${toEasyOrdersErrorKey(connection.startErrorCode)}`)}
    </Notice>
  )
  const readOnly = !canManage && status && (
    <Notice tone="warning" icon={<Eye aria-hidden="true" />} role="status">
      {t('readOnly')}
    </Notice>
  )
  const cleanup = <p className="text-ink-muted text-sm">{t('cleanup')}</p>

  return (
    <Frame>
      <p className="text-brand-ink text-sm font-semibold">{t('eyebrow')}</p>

      {view === 'loadError' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="destructive">
          {heading(t('loadError.title'))}
          <p className="text-ink-muted text-sm">{t('loadError.body')}</p>
          <Button
            size="lg"
            className="font-semibold"
            onClick={() => void connection.reload()}
          >
            {t('loadError.retry')}
          </Button>
        </Panel>
      )}

      {view === 'unavailable' && (
        <Panel icon={<Clock aria-hidden="true" />} tone="muted">
          {heading(t('unavailable.title'))}
          <p className="text-ink-muted text-sm">{t('unavailable.body')}</p>
        </Panel>
      )}

      {view === 'pilotRequired' && (
        <Panel icon={<ShieldCheck aria-hidden="true" />} tone="muted">
          {heading(t('pilotRequired.title'))}
          <p className="text-ink-muted text-sm">{t('pilotRequired.body')}</p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => void connection.reload()}
          >
            {t('pilotRequired.refresh')}
          </Button>
        </Panel>
      )}

      {view === 'sourceExists' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="muted">
          {heading(t('sourceExists.title'))}
          <p className="text-ink-muted text-sm">{t('sourceExists.body')}</p>
        </Panel>
      )}

      {view === 'connect' && (
        <Panel icon={<Link2 aria-hidden="true" />} tone="brand">
          {heading(
            store ? t('connect.title', { store }) : t('connect.titleNoStore')
          )}
          <p className="text-ink-muted text-sm">{t('connect.body')}</p>
          <div className="space-y-2">
            <p className="text-ink text-sm font-semibold">
              {t('connect.permissionsTitle')}
            </p>
            <ul className="space-y-2">
              {PERMISSIONS.map((permission) => (
                <li
                  key={permission}
                  className="text-ink flex items-start gap-2 text-sm"
                >
                  <Check
                    aria-hidden="true"
                    className="text-primary mt-0.5 size-4 shrink-0"
                  />
                  {t(`connect.permissions.${permission}`)}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-ink-muted text-sm">{t('connect.sender')}</p>
          {readOnly}
          {startError}
          {connectButton(t('connect.cta'))}
          <p className="text-ink-muted text-sm">{t('connect.note')}</p>
        </Panel>
      )}

      {view === 'waiting' && (
        <Panel
          icon={
            <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
          }
          tone="brand"
        >
          {heading(t('waiting.title'))}
          <p role="status" className="text-ink-muted text-sm">
            {t('waiting.body')}
          </p>
          {status?.expiresAt && (
            <p className="text-ink-muted text-sm">
              {t('waiting.expires', {
                time: new Intl.DateTimeFormat(
                  locale === 'ar' ? 'ar-EG' : 'en-US',
                  { hour: 'numeric', minute: '2-digit' }
                ).format(new Date(status.expiresAt)),
              })}
            </p>
          )}
          {startError}
          <div className="flex flex-col gap-3 sm:flex-row">
            {connectButton(t('waiting.restart'))}
            <Button
              size="lg"
              variant="outline"
              onClick={connection.markCancelled}
            >
              {t('waiting.cancelled')}
            </Button>
          </div>
        </Panel>
      )}

      {view === 'denied' && (
        <Panel icon={<XCircle aria-hidden="true" />} tone="muted">
          {heading(t('denied.title'))}
          <p className="text-ink-muted text-sm">{t('denied.body')}</p>
          {cleanup}
          {readOnly}
          {startError}
          {connectButton(t('denied.retry'))}
        </Panel>
      )}

      {view === 'error' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="destructive">
          {heading(t('error.title'))}
          <p role="alert" className="text-ink text-sm">
            {t(`error.codes.${toEasyOrdersErrorKey(status?.lastErrorCode)}`)}
          </p>
          {cleanup}
          {readOnly}
          {startError}
          {connectButton(t('error.retry'))}
        </Panel>
      )}

      {view === 'success' && status?.connection && (
        <>
          <Panel
            icon={<Check aria-hidden="true" strokeWidth={3} />}
            tone="brand"
          >
            <StatusBadge kind="confirmed">{t('success.badge')}</StatusBadge>
            {heading(
              store ? t('success.title', { store }) : t('success.titleNoStore')
            )}
            <dl className="text-sm">
              <dt className="text-ink-muted">{t('success.storeIdLabel')}</dt>
              <dd>
                <bdi dir="ltr" className="text-ink font-mono font-semibold">
                  {status.connection.storeId}
                </bdi>
              </dd>
            </dl>
            {!status.connection.storeVerified && (
              <p className="text-ink-muted text-sm">
                {t('success.storeUnverified')}
              </p>
            )}
            {status.connection.health === 'store_inactive' && (
              <Notice
                tone="warning"
                icon={<AlertCircle aria-hidden="true" />}
                role="status"
              >
                <span className="font-semibold">
                  {t('success.inactive.title')}
                </span>{' '}
                {t('success.inactive.body')}
              </Notice>
            )}
            {status.connection.health === 'credentials_rejected' && (
              <Notice
                tone="destructive"
                icon={<AlertCircle aria-hidden="true" />}
              >
                <span className="font-semibold">
                  {t('success.keyRejected.title')}
                </span>{' '}
                {t('success.keyRejected.body')}
              </Notice>
            )}
            {status.connection.rejectedDeliveries > 0 && (
              <Notice
                tone="warning"
                icon={<AlertCircle aria-hidden="true" />}
                role="status"
              >
                {t('success.rejectedDeliveries', {
                  count: status.connection.rejectedDeliveries,
                })}
              </Notice>
            )}
            <p className="text-ink-muted text-sm">{t('success.next')}</p>
          </Panel>

          <div className={cn(akCard, 'space-y-4 p-6 sm:p-8')}>
            {readOnly}
            <OrderSettingsForm
              currency={status.connection.currency}
              phoneCountry={status.connection.phoneCountry}
              canManage={canManage}
              isSaving={connection.isSavingSettings}
              saved={connection.settingsSaved}
              failed={connection.settingsErrorCode !== null}
              onSave={connection.saveSettings}
            />
          </div>

          <div className={cn(akCard, 'space-y-4 p-6 sm:p-8')}>
            {readOnly}
            <WebhookSecretsForm
              webhookUrlHint={status.connection.webhookUrlHint}
              alreadySet={
                status.connection.ordersSecretSet &&
                status.connection.statusSecretSet
              }
              canManage={canManage}
              isSaving={connection.isSavingSecrets}
              saved={connection.secretsSaved}
              failed={connection.secretsErrorCode !== null}
              onSave={connection.saveSecrets}
            />
          </div>
        </>
      )}
    </Frame>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-12">
      {children}
    </div>
  )
}

type Tone = 'brand' | 'muted' | 'destructive'

const ICON_TONES: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-ink',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
}

function Panel({
  icon,
  tone,
  children,
}: {
  icon: ReactNode
  tone: Tone
  children: ReactNode
}) {
  return (
    <section className={cn(akCard, 'space-y-4 p-6 text-start sm:p-8')}>
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-full [&_svg]:size-6',
          ICON_TONES[tone]
        )}
      >
        {icon}
      </span>
      {children}
    </section>
  )
}

const NOTICE_TONES = {
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  destructive:
    'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
} as const

function Notice({
  tone,
  icon,
  role = 'alert',
  children,
}: {
  tone: keyof typeof NOTICE_TONES
  icon: ReactNode
  role?: 'alert' | 'status'
  children: ReactNode
}) {
  return (
    <div
      role={role}
      className={cn(
        'rounded-panel flex items-start gap-2 border p-3 text-start text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0',
        NOTICE_TONES[tone]
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}
