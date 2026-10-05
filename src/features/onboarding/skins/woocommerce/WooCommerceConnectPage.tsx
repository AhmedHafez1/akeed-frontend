'use client'

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
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
  Input,
  Label,
  LoadingButton,
  Skeleton,
  StatusBadge,
  akCard,
} from '@/shared/ui'
import {
  ConnectionLine,
  type ConnectionLineState,
} from '../connect/ConnectionLine'
import { SourceSetupChecklist } from '../connect/SourceSetupChecklist'
import { Frame, Notice, Panel } from '../easyorders/easyOrdersUi'
import { DisconnectWooCommerceDialog } from './DisconnectWooCommerceDialog'
import {
  displayStoreAddress,
  isUnnamedWooCommerceError,
  isWooCommerceReconnect,
  toStoreAddress,
  toWooCommerceErrorKey,
  type WooCommerceConnectView,
} from './wooCommerce.types'
import { useWooCommerceConnection } from './useWooCommerceConnection'
import { useWooCommerceSetupFlow } from './useWooCommerceSetupFlow'
import { WooCommerceConnectionCheck } from './WooCommerceConnectionCheck'
import { WooCommerceKeyRemovalSteps } from './WooCommerceKeyRemovalSteps'
import { WooCommerceWebhookStatus } from './WooCommerceWebhookStatus'

const STORE_URL_FIELD = 'woocommerce-store-url'
const USES = ['orders', 'notifications', 'outcomes'] as const

/**
 * Connecting a WooCommerce store and finishing its setup: enter its address,
 * approve in the store, wait while the store sends Akeed its access, then
 * connected (with the setup checklist, then the free test); or denied,
 * unsupported store, error, rejected access or disconnected, one at a time.
 * The authorize link, the keys, the webhook secret and the delivery address
 * never appear on this screen.
 */
export function WooCommerceConnectPage() {
  const t = useTranslations('wooCommerceConnect')
  const locale = useLocale() === 'en' ? 'en' : 'ar'
  const connection = useWooCommerceConnection(locale)
  const { view, status, canManage } = connection
  const setup = useWooCommerceSetupFlow(
    status?.connection ?? null,
    view === 'connected'
  )
  const [storeUrl, setStoreUrl] = useState('')
  const [missingUrl, setMissingUrl] = useState(false)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownRef = useRef<string | null>(null)
  // The connected screen has steps of its own; each is a new place to land.
  const shown: WooCommerceConnectView | `connected:${string}` =
    view === 'connected' ? `connected:${setup.step}` : view

  // Land keyboard and screen-reader users on each new state, not on load.
  useEffect(() => {
    if (shown === 'loading') return
    if (shownRef.current !== null && shownRef.current !== shown) {
      headingRef.current?.focus()
    }
    shownRef.current = shown
  }, [shown])

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

  const details = status?.connection ?? null
  const shownStore = details?.storeUrl ?? status?.storeUrl ?? null
  const reconnecting = isWooCommerceReconnect(status)
  const heading = (text: ReactNode) => (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className="text-ink text-h3 font-bold focus-visible:outline-none"
    >
      {text}
    </h1>
  )
  // The store stays named in every state: what was typed, then the address
  // Akeed holds for the install or the connection.
  const line = (state: ConnectionLineState, address = shownStore) => (
    <ConnectionLine
      state={state}
      store={displayStoreAddress(address)}
      storeIsAddress
    />
  )
  const readOnly = !canManage && status && (
    <Notice tone="warning" icon={<Eye aria-hidden="true" />} role="status">
      {t('readOnly')}
    </Notice>
  )
  const cleanup = <p className="text-ink-muted text-sm">{t('cleanup')}</p>
  const reconnectNote = reconnecting && (
    <p className="text-ink-muted text-sm">{t('disconnected.sameStore')}</p>
  )
  const startError = connection.startErrorCode && (
    <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
      {t(`codes.${toWooCommerceErrorKey(connection.startErrorCode)}`)}
    </Notice>
  )
  const tryAgain = (label: string) => (
    <Button
      size="lg"
      className="w-full font-semibold sm:w-auto"
      disabled={!canManage}
      onClick={() => {
        setStoreUrl(shownStore ?? '')
        connection.restart()
      }}
    >
      {label}
    </Button>
  )
  const confirmDisconnect = async () => {
    if (await connection.disconnect()) setConfirmingDisconnect(false)
  }
  const disconnectDialog = (
    <DisconnectWooCommerceDialog
      open={confirmingDisconnect}
      isDisconnecting={connection.isDisconnecting}
      error={
        !connection.disconnectErrorCode
          ? null
          : isUnnamedWooCommerceError(connection.disconnectErrorCode)
            ? t('disconnect.failed')
            : t(
                `codes.${toWooCommerceErrorKey(connection.disconnectErrorCode)}`
              )
      }
      onConfirm={() => void confirmDisconnect()}
      onDismiss={() => {
        setConfirmingDisconnect(false)
        connection.clearDisconnectError()
      }}
    />
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const typed = storeUrl.trim()
    setMissingUrl(!typed)
    if (typed) void connection.connect(toStoreAddress(typed))
  }
  const startErrorCode = connection.startErrorCode
  const fieldError = missingUrl
    ? t('enterUrl.required')
    : startErrorCode
      ? t(`codes.${toWooCommerceErrorKey(startErrorCode)}`)
      : null

  if (view === 'connected' && setup.step === 'test' && setup.state) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-12">
        <TestStep
          test={setup.test}
          completion={setup.completion}
          blockedReasons={setup.blockedReasons}
          phone={setup.state.merchantWhatsappPhone ?? setup.phone.value}
          storeName={
            setup.state.storeName ?? status?.organizationName?.trim() ?? ''
          }
          canManage={setup.canManage}
          headingRef={headingRef}
        />
      </div>
    )
  }

  if (view === 'connected' && setup.step === 'done') {
    return (
      <Frame>
        <Panel icon={<Check aria-hidden="true" strokeWidth={3} />} tone="brand">
          <StatusBadge kind="confirmed">{t('done.badge')}</StatusBadge>
          {heading(t('done.title'))}
          <p className="text-ink-muted text-sm">{t('done.body')}</p>
          <p className="text-ink-muted text-sm">{t('connected.next')}</p>
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

      {view === 'enterUrl' && (
        <Panel lead={line('idle', storeUrl)} tone="brand">
          {heading(t('enterUrl.title'))}
          <p className="text-ink-muted text-sm">{t('enterUrl.body')}</p>
          <form
            className="space-y-4 text-start"
            onSubmit={submit}
            noValidate
            aria-busy={connection.isStarting}
          >
            <div className="space-y-2">
              <Label
                htmlFor={STORE_URL_FIELD}
                className="text-ink text-sm font-semibold"
              >
                {t('enterUrl.label')}
              </Label>
              <Input
                id={STORE_URL_FIELD}
                name="storeUrl"
                type="url"
                inputMode="url"
                dir="ltr"
                autoComplete="url"
                spellCheck={false}
                placeholder={t('enterUrl.placeholder')}
                value={storeUrl}
                disabled={!canManage || connection.isStarting}
                onChange={(event) => {
                  setStoreUrl(event.target.value)
                  setMissingUrl(false)
                }}
                aria-describedby={`${STORE_URL_FIELD}-hint${fieldError ? ` ${STORE_URL_FIELD}-error` : ''}`}
                aria-invalid={Boolean(fieldError)}
                className="rounded-control bg-card h-14 px-4 text-start text-lg font-semibold"
              />
              <p
                id={`${STORE_URL_FIELD}-hint`}
                className="text-ink-muted text-sm"
              >
                {t('enterUrl.hint')}
              </p>
            </div>
            {fieldError && (
              <div id={`${STORE_URL_FIELD}-error`}>
                <Notice
                  tone="destructive"
                  icon={<AlertCircle aria-hidden="true" />}
                >
                  {fieldError}
                </Notice>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-ink text-sm font-semibold">
                {t('enterUrl.usesTitle')}
              </p>
              <ul className="space-y-2">
                {USES.map((use) => (
                  <li
                    key={use}
                    className="text-ink flex items-start gap-2 text-sm"
                  >
                    <Check
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-4 shrink-0"
                    />
                    {t(`enterUrl.uses.${use}`)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-ink-muted text-sm">{t('enterUrl.sender')}</p>
            {readOnly}
            <LoadingButton
              type="submit"
              size="lg"
              className="w-full gap-2 px-8 font-semibold sm:w-auto"
              disabled={!canManage}
              loading={connection.isStarting}
              loadingText={t('enterUrl.checking')}
            >
              <Link2 aria-hidden="true" />
              {t('enterUrl.cta')}
            </LoadingButton>
            <p className="text-ink-muted text-sm">{t('enterUrl.note')}</p>
          </form>
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
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!canManage}
            onClick={() => {
              setStoreUrl(shownStore ?? '')
              connection.restart()
            }}
          >
            {t('waiting.restart')}
          </Button>
        </Panel>
      )}

      {view === 'denied' && (
        <Panel lead={line('refused')} tone="muted">
          {heading(t('denied.title'))}
          <p className="text-ink-muted text-sm">{t('denied.body')}</p>
          {reconnectNote}
          {cleanup}
          {readOnly}
          {tryAgain(t('denied.retry'))}
        </Panel>
      )}

      {view === 'unsupported' && (
        <Panel lead={line('refused')} tone="destructive">
          {heading(t('unsupported.title'))}
          <p role="alert" className="text-ink text-sm">
            {t(`codes.${toWooCommerceErrorKey(status?.lastErrorCode)}`)}
          </p>
          <p className="text-ink-muted text-sm">{t('unsupported.nothing')}</p>
          {reconnectNote}
          {cleanup}
          {readOnly}
          {tryAgain(t('unsupported.retry'))}
        </Panel>
      )}

      {view === 'error' && (
        <Panel lead={line('refused')} tone="destructive">
          {heading(t('error.title'))}
          <p role="alert" className="text-ink text-sm">
            {status?.state === 'expired'
              ? t('error.expired')
              : t(`codes.${toWooCommerceErrorKey(status?.lastErrorCode)}`)}
          </p>
          {reconnectNote}
          {cleanup}
          {readOnly}
          {tryAgain(t('error.retry'))}
        </Panel>
      )}

      {view === 'connected' && details && (
        <>
          <Panel lead={line('connected')} tone="brand">
            <StatusBadge kind="confirmed">{t('connected.badge')}</StatusBadge>
            {heading(t('connected.title'))}
            <p className="text-ink-muted text-sm">{t('connected.body')}</p>
          </Panel>

          <div className={cn(akCard, 'space-y-4 p-6 sm:p-8')}>
            {readOnly}
            <WooCommerceWebhookStatus
              details={details}
              connection={connection}
            />
            <div className="border-line border-t pt-4">
              <WooCommerceConnectionCheck connection={connection} />
            </div>
          </div>

          <SourceSetupChecklist
            setup={setup}
            namespace="wooCommerceConnect.checklist"
            idPrefix="woocommerce"
          />
        </>
      )}

      {view === 'credentialsRejected' && details && (
        <Panel lead={line('refused')} tone="destructive">
          {heading(t('credentialsRejected.title'))}
          <p role="alert" className="text-ink text-sm">
            {details.health === 'permission_denied'
              ? t('credentialsRejected.bodyDenied')
              : t('credentialsRejected.bodyRejected')}
          </p>
          <p className="text-ink-muted text-sm">
            {t('credentialsRejected.recovery')}
          </p>
          <p className="text-ink-muted text-sm">
            {t('credentialsRejected.lastSeen')}
          </p>
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
            {heading(t('disconnected.title'))}
            <p className="text-ink-muted text-sm">{t('disconnected.body')}</p>
            <p className="text-ink-muted text-sm">
              {t('disconnected.historyKept')}
            </p>
            <p className="text-ink-muted text-sm">
              {t('disconnected.reconnectBody')}
            </p>
            {readOnly}
            {startError}
            <LoadingButton
              size="lg"
              className="w-full gap-2 px-8 font-semibold sm:w-auto"
              disabled={!canManage}
              loading={connection.isStarting}
              loadingText={t('enterUrl.checking')}
              onClick={() => void connection.reconnect()}
            >
              <Link2 aria-hidden="true" />
              {t('disconnected.reconnect')}
            </LoadingButton>
          </Panel>
          <div className={cn(akCard, 'p-6 sm:p-8')}>
            <WooCommerceKeyRemovalSteps
              webhookCleanup={connection.webhookCleanup}
            />
          </div>
        </>
      )}

      {disconnectDialog}
    </Frame>
  )
}
