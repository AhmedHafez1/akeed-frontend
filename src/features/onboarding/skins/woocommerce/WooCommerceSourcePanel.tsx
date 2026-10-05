'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Eye, Link2, Unplug } from 'lucide-react'
import { Button, LoadingButton, Skeleton } from '@/shared/ui'
import { useSourceHealthReadAt } from '../connect/useSourceHealthReadAt'
import { Notice } from '../easyorders/easyOrdersUi'
import { DisconnectWooCommerceDialog } from './DisconnectWooCommerceDialog'
import {
  displayStoreAddress,
  isUnnamedWooCommerceError,
  toWooCommerceErrorKey,
} from './wooCommerce.types'
import { useWooCommerceConnection } from './useWooCommerceConnection'
import { WooCommerceConnectionCheck } from './WooCommerceConnectionCheck'
import { WooCommerceKeyRemovalSteps } from './WooCommerceKeyRemovalSteps'
import { WooCommerceWebhookStatus } from './WooCommerceWebhookStatus'

interface WooCommerceSourcePanelProps {
  /** The connection changed in a way the rest of Settings should re-read. */
  onChanged?: () => void
}

/**
 * The WooCommerce connection inside Settings, after setup: the store, the
 * state of its order notifications, a connection check, disconnect, and the
 * way back for a disconnected store. Owners and admins manage it; everyone
 * else reads it. No key, secret or delivery address is ever shown.
 */
export function WooCommerceSourcePanel({
  onChanged,
}: WooCommerceSourcePanelProps) {
  const t = useTranslations('wooCommerceConnect')
  const locale = useLocale() === 'en' ? 'en' : 'ar'
  const connection = useWooCommerceConnection(locale)
  const { view, status, canManage, reload } = connection
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)

  // The health card beside this panel asks the store, and what it finds is
  // stored on the connection. Read the status again once its answer lands,
  // so a notification it found disabled can be re-enabled from here.
  const healthReadAt = useSourceHealthReadAt()
  const seenHealthRead = useRef(healthReadAt)
  useEffect(() => {
    if (healthReadAt === seenHealthRead.current) return
    seenHealthRead.current = healthReadAt
    void reload()
  }, [healthReadAt, reload])

  // Tell Settings when the connection moves, so its state and health follow.
  const details = status?.connection ?? null
  const signature = status
    ? [
        status.state,
        details?.health,
        ...(details?.webhooks.map((webhook) => webhook.state) ?? []),
      ].join('|')
    : null
  const seenSignature = useRef<string | null>(null)
  useEffect(() => {
    if (signature === null) return
    if (seenSignature.current !== null && seenSignature.current !== signature)
      onChanged?.()
    seenSignature.current = signature
  }, [onChanged, signature])

  if (view === 'loading') {
    return (
      <div aria-busy="true" className="space-y-3 p-4 sm:p-6">
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  const shownStore = displayStoreAddress(
    details?.storeUrl ?? status?.storeUrl ?? null
  )
  const storeAddress = shownStore && (
    <dl className="text-sm">
      <dt className="text-ink-muted">{t('storeLabel')}</dt>
      <dd>
        <bdi dir="ltr" className="text-ink font-mono font-semibold">
          {shownStore}
        </bdi>
      </dd>
    </dl>
  )
  const readOnly = !canManage && status && (
    <Notice tone="warning" icon={<Eye aria-hidden="true" />} role="status">
      {t('panel.readOnly')}
    </Notice>
  )
  const startError = connection.startErrorCode && (
    <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
      {t(`codes.${toWooCommerceErrorKey(connection.startErrorCode)}`)}
    </Notice>
  )
  const reconnectButton = (label: string) => (
    <LoadingButton
      className="w-full gap-2 font-semibold sm:w-auto"
      disabled={!canManage}
      loading={connection.isStarting}
      loadingText={t('enterUrl.checking')}
      onClick={() => void connection.reconnect()}
    >
      <Link2 aria-hidden="true" />
      {label}
    </LoadingButton>
  )
  const confirmDisconnect = async () => {
    if (await connection.disconnect()) setConfirmingDisconnect(false)
  }

  return (
    <div className="space-y-4 p-4 text-start sm:p-6">
      {view === 'loadError' && (
        <>
          <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
            {t('loadError.title')}
          </Notice>
          <Button variant="outline" onClick={() => void connection.reload()}>
            {t('loadError.retry')}
          </Button>
        </>
      )}

      {(view === 'connected' || view === 'credentialsRejected') && details && (
        <>
          {storeAddress}
          {view === 'credentialsRejected' && (
            <Notice
              tone="destructive"
              icon={<AlertCircle aria-hidden="true" />}
            >
              <span className="block font-semibold">
                {t('credentialsRejected.title')}
              </span>
              <span className="block">
                {details.health === 'permission_denied'
                  ? t('credentialsRejected.bodyDenied')
                  : t('credentialsRejected.bodyRejected')}
              </span>
              <span className="block">{t('credentialsRejected.recovery')}</span>
            </Notice>
          )}
          {readOnly}
          {view === 'connected' && (
            <WooCommerceWebhookStatus
              details={details}
              connection={connection}
            />
          )}

          <div className="border-line border-t pt-4">
            <WooCommerceConnectionCheck connection={connection} />
          </div>

          {canManage && (
            <div className="border-line space-y-2 border-t pt-4">
              <p className="text-ink-muted text-sm">
                {t('panel.disconnectHelp')}
              </p>
              <Button
                variant="outline"
                className="w-full gap-2 font-semibold sm:w-auto"
                onClick={() => setConfirmingDisconnect(true)}
              >
                <Unplug aria-hidden="true" />
                {t('disconnect.button')}
              </Button>
            </div>
          )}
        </>
      )}

      {view === 'disconnected' && (
        <>
          <p className="text-ink text-sm font-semibold">
            {t('panel.disconnectedTitle')}
          </p>
          {storeAddress}
          <p className="text-ink-muted text-sm">{t('disconnected.body')}</p>
          <p className="text-ink-muted text-sm">
            {t('disconnected.historyKept')}
          </p>
          <WooCommerceKeyRemovalSteps
            webhookCleanup={connection.webhookCleanup}
          />
          <p className="text-ink-muted text-sm">
            {t('disconnected.reconnectBody')}
          </p>
          {readOnly}
          {startError}
          {reconnectButton(t('disconnected.reconnect'))}
        </>
      )}

      {view === 'waiting' && (
        <>
          <p className="text-ink text-sm font-semibold">{t('waiting.title')}</p>
          {storeAddress}
          <p role="status" className="text-ink-muted text-sm">
            {t('waiting.body')}
          </p>
          <p className="text-ink-muted text-sm">
            {t('disconnected.sameStore')}
          </p>
          {startError}
          {reconnectButton(t('waiting.restart'))}
        </>
      )}

      {(view === 'error' || view === 'unsupported' || view === 'denied') && (
        <>
          <p className="text-ink text-sm font-semibold">
            {view === 'denied' ? t('denied.title') : t('error.title')}
          </p>
          {storeAddress}
          <p role="alert" className="text-ink text-sm">
            {view === 'denied'
              ? t('denied.body')
              : status?.state === 'expired'
                ? t('error.expired')
                : t(`codes.${toWooCommerceErrorKey(status?.lastErrorCode)}`)}
          </p>
          <p className="text-ink-muted text-sm">
            {t('disconnected.sameStore')}
          </p>
          <p className="text-ink-muted text-sm">{t('cleanup')}</p>
          {readOnly}
          {startError}
          {reconnectButton(t('error.retry'))}
        </>
      )}

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
    </div>
  )
}
