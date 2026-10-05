'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  AlertCircle,
  Check,
  Clock,
  Eye,
  Link2,
  ShieldCheck,
  Unplug,
} from 'lucide-react'
import { TestStep } from '@/features/onboarding/ui/standalone/steps/TestStep'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  LoadingButton,
  Skeleton,
  StatusBadge,
  akCard,
} from '@/shared/ui'
import {
  ConnectionLine,
  type ConnectionLineState,
} from '../connect/ConnectionLine'
import { DisconnectEasyOrdersDialog } from './DisconnectEasyOrdersDialog'
import {
  isEasyOrdersReconnect,
  toEasyOrdersErrorKey,
  type EasyOrdersConnectView,
} from './easyOrders.types'
import { EasyOrdersSetupChecklist } from './EasyOrdersSetupChecklist'
import { Frame, Notice, Panel } from '../connect/connectUi'
import { OrderSettingsForm } from './OrderSettingsForm'
import { ProviderRemovalSteps } from './ProviderRemovalSteps'
import { useEasyOrdersConnection } from './useEasyOrdersConnection'
import { useEasyOrdersSetupFlow } from './useEasyOrdersSetupFlow'
import { WebhookSecretsForm } from './WebhookSecretsForm'

const PERMISSIONS = ['read', 'update'] as const

/**
 * Connecting an EasyOrders store and finishing its setup: connect, waiting,
 * not completed, error, connected (with the setup checklist, then the free
 * test), revoked and disconnected, one at a time. The install link, the API
 * key and the webhook secrets never appear on this screen.
 */
export function EasyOrdersConnectPage() {
  const t = useTranslations('easyOrdersConnect')
  const locale = useLocale() === 'en' ? 'en' : 'ar'
  const connection = useEasyOrdersConnection(locale)
  const { view, status, canManage } = connection
  const setup = useEasyOrdersSetupFlow(
    status?.connection ?? null,
    view === 'success'
  )
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownRef = useRef<string | null>(null)
  // The connected screen has steps of its own; each is a new place to land.
  const shown: EasyOrdersConnectView | `success:${string}` =
    view === 'success' ? `success:${setup.step}` : view

  // Land keyboard and screen-reader users on each new state, not on load.
  useEffect(() => {
    if (shown === 'loading') return
    if (shownRef.current !== null && shownRef.current !== shown) {
      headingRef.current?.focus()
    }
    shownRef.current = shown
  }, [shown])

  const confirmDisconnect = async () => {
    if (await connection.disconnect()) setConfirmingDisconnect(false)
  }

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
  const line = (state: ConnectionLineState) => (
    <ConnectionLine state={state} store={store} />
  )
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
  const reconnecting = isEasyOrdersReconnect(status)
  const reconnectNote = reconnecting && (
    <p className="text-ink-muted text-sm">{t('disconnected.sameStore')}</p>
  )
  const disconnectDialog = (
    <DisconnectEasyOrdersDialog
      open={confirmingDisconnect}
      isDisconnecting={connection.isDisconnecting}
      error={
        connection.disconnectErrorCode
          ? t(
              `error.codes.${toEasyOrdersErrorKey(connection.disconnectErrorCode)}`
            )
          : null
      }
      onConfirm={() => void confirmDisconnect()}
      onDismiss={() => {
        setConfirmingDisconnect(false)
        connection.clearDisconnectError()
      }}
    />
  )

  if (view === 'success' && setup.step === 'test' && setup.state) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-12">
        <TestStep
          test={setup.test}
          completion={setup.completion}
          blockedReasons={setup.blockedReasons}
          phone={setup.state.merchantWhatsappPhone ?? setup.phone.value}
          storeName={setup.state.storeName ?? store ?? ''}
          canManage={setup.canManage}
          headingRef={headingRef}
        />
      </div>
    )
  }

  if (view === 'success' && setup.step === 'done') {
    return (
      <Frame>
        <Panel icon={<Check aria-hidden="true" strokeWidth={3} />} tone="brand">
          <StatusBadge kind="confirmed">{t('done.badge')}</StatusBadge>
          {heading(t('done.title'))}
          <p className="text-ink-muted text-sm">{t('done.body')}</p>
          <p className="text-ink-muted text-sm">{t('success.next')}</p>
          <Button asChild size="lg" className="font-semibold">
            <Link href={setup.dashboardPath}>{t('done.dashboard')}</Link>
          </Button>
        </Panel>
      </Frame>
    )
  }

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
        <Panel lead={line('idle')} tone="brand">
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
        <Panel lead={line('waiting')} tone="brand">
          {heading(t('waiting.title'))}
          <p role="status" className="text-ink-muted text-sm">
            {t('waiting.body')}
          </p>
          {reconnectNote}
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
        <Panel lead={line('refused')} tone="muted">
          {heading(t('denied.title'))}
          <p className="text-ink-muted text-sm">{t('denied.body')}</p>
          {reconnectNote}
          {cleanup}
          {readOnly}
          {startError}
          {connectButton(t('denied.retry'))}
        </Panel>
      )}

      {view === 'error' && (
        <Panel lead={line('refused')} tone="destructive">
          {heading(t('error.title'))}
          <p role="alert" className="text-ink text-sm">
            {t(`error.codes.${toEasyOrdersErrorKey(status?.lastErrorCode)}`)}
          </p>
          {reconnectNote}
          {cleanup}
          {readOnly}
          {startError}
          {connectButton(t('error.retry'))}
        </Panel>
      )}

      {view === 'success' && status?.connection && (
        <>
          <Panel lead={line('connected')} tone="brand">
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
              webhookUrlHint={status.connection.webhookUrlHint ?? ''}
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
            <p className="text-ink-muted text-sm">
              {t('success.secrets.duplicates')}
            </p>
          </div>

          <EasyOrdersSetupChecklist setup={setup} />
        </>
      )}

      {view === 'revoked' && (
        <Panel lead={line('refused')} tone="destructive">
          {heading(t('revoked.title'))}
          <p role="alert" className="text-ink text-sm">
            {t('revoked.body')}
          </p>
          <p className="text-ink-muted text-sm">{t('revoked.recovery')}</p>
          <p className="text-ink-muted text-sm">{t('revoked.lastSeen')}</p>
          {readOnly}
          <Button
            size="lg"
            variant="outline"
            className="gap-2 font-semibold"
            disabled={!canManage}
            onClick={() => setConfirmingDisconnect(true)}
          >
            <Unplug aria-hidden="true" />
            {t('disconnect.button')}
          </Button>
        </Panel>
      )}

      {view === 'disconnected' && (
        <>
          <Panel lead={line('disconnected')} tone="muted">
            {heading(
              store
                ? t('disconnected.title', { store })
                : t('disconnected.titleNoStore')
            )}
            <p className="text-ink-muted text-sm">{t('disconnected.body')}</p>
            <p className="text-ink-muted text-sm">
              {t('disconnected.historyKept')}
            </p>
            {status?.connection && (
              <dl className="text-sm">
                <dt className="text-ink-muted">{t('success.storeIdLabel')}</dt>
                <dd>
                  <bdi dir="ltr" className="text-ink font-mono font-semibold">
                    {status.connection.storeId}
                  </bdi>
                </dd>
              </dl>
            )}
            <p className="text-ink-muted text-sm">
              {t('disconnected.reconnectBody')}
            </p>
            {readOnly}
            {startError}
            {connectButton(t('disconnected.reconnect'))}
          </Panel>
          <div className={cn(akCard, 'p-6 sm:p-8')}>
            <ProviderRemovalSteps />
          </div>
        </>
      )}

      {disconnectDialog}
    </Frame>
  )
}
