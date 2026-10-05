'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Eye, Link2, Unplug } from 'lucide-react'
import { Button, LoadingButton, Skeleton } from '@/shared/ui'
import { DisconnectEasyOrdersDialog } from './DisconnectEasyOrdersDialog'
import { toEasyOrdersErrorKey } from './easyOrders.types'
import { Notice } from '../connect/connectUi'
import { ProviderRemovalSteps } from './ProviderRemovalSteps'
import { useEasyOrdersConnection } from './useEasyOrdersConnection'
import { WebhookSecretsForm } from './WebhookSecretsForm'

interface EasyOrdersSourcePanelProps {
  /** The connection changed in a way the rest of Settings should re-read. */
  onChanged?: () => void
}

/**
 * The EasyOrders connection inside Settings, after setup: its state, the
 * webhook secrets, disconnect, and the way back for a disconnected store.
 * Owners and admins manage it; everyone else reads it. No key, token or
 * secret is ever shown.
 */
export function EasyOrdersSourcePanel({
  onChanged,
}: EasyOrdersSourcePanelProps) {
  const t = useTranslations('easyOrdersConnect')
  const locale = useLocale() === 'en' ? 'en' : 'ar'
  const connection = useEasyOrdersConnection(locale)
  const { view, status, canManage } = connection
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)

  // Tell Settings when the connection moves, so its state and health follow.
  const details = status?.connection
  const signature = status
    ? [
        status.state,
        details?.health,
        details?.ordersSecretSet,
        details?.statusSecretSet,
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

  const readOnly = !canManage && status && (
    <Notice tone="warning" icon={<Eye aria-hidden="true" />} role="status">
      {t('panel.readOnly')}
    </Notice>
  )
  const startError = connection.startErrorCode && (
    <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
      {t(`error.codes.${toEasyOrdersErrorKey(connection.startErrorCode)}`)}
    </Notice>
  )
  const reconnectButton = (label: string) => (
    <LoadingButton
      className="w-full gap-2 font-semibold sm:w-auto"
      disabled={!canManage}
      loading={connection.isStarting}
      loadingText={t('connect.starting')}
      onClick={() => void connection.connect()}
    >
      <Link2 aria-hidden="true" />
      {label}
    </LoadingButton>
  )
  const disconnectButton = canManage && (
    <Button
      variant="outline"
      className="w-full gap-2 font-semibold sm:w-auto"
      onClick={() => setConfirmingDisconnect(true)}
    >
      <Unplug aria-hidden="true" />
      {t('disconnect.button')}
    </Button>
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

      {(view === 'success' || view === 'revoked') && details && (
        <>
          <dl className="text-sm">
            <dt className="text-ink-muted">{t('success.storeIdLabel')}</dt>
            <dd>
              <bdi dir="ltr" className="text-ink font-mono font-semibold">
                {details.storeId}
              </bdi>
            </dd>
          </dl>
          {!details.storeVerified && (
            <p className="text-ink-muted text-sm">
              {t('success.storeUnverified')}
            </p>
          )}
          {view === 'revoked' && (
            <Notice
              tone="destructive"
              icon={<AlertCircle aria-hidden="true" />}
            >
              <span className="font-semibold">{t('revoked.title')}</span>{' '}
              {t('revoked.body')} {t('revoked.recovery')}
            </Notice>
          )}
          {details.health === 'store_inactive' && (
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
          {readOnly}
          {view === 'success' && (
            <>
              <WebhookSecretsForm
                webhookUrlHint={details.webhookUrlHint ?? ''}
                alreadySet={details.ordersSecretSet && details.statusSecretSet}
                canManage={canManage}
                isSaving={connection.isSavingSecrets}
                saved={connection.secretsSaved}
                failed={connection.secretsErrorCode !== null}
                onSave={connection.saveSecrets}
              />
              <p className="text-ink-muted text-sm">
                {t('success.secrets.duplicates')}
              </p>
            </>
          )}
          {disconnectButton && (
            <div className="border-line space-y-2 border-t pt-4">
              <p className="text-ink-muted text-sm">
                {t('panel.disconnectHelp')}
              </p>
              {disconnectButton}
            </div>
          )}
        </>
      )}

      {view === 'disconnected' && (
        <>
          <p className="text-ink text-sm font-semibold">
            {t('panel.disconnectedTitle')}
          </p>
          <p className="text-ink-muted text-sm">{t('disconnected.body')}</p>
          <p className="text-ink-muted text-sm">
            {t('disconnected.historyKept')}
          </p>
          <ProviderRemovalSteps />
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
          <p role="status" className="text-ink-muted text-sm">
            {t('waiting.body')}
          </p>
          <p className="text-ink-muted text-sm">
            {t('disconnected.sameStore')}
          </p>
          {startError}
          <div className="flex flex-col gap-3 sm:flex-row">
            {reconnectButton(t('waiting.restart'))}
            <Button variant="outline" onClick={connection.markCancelled}>
              {t('waiting.cancelled')}
            </Button>
          </div>
        </>
      )}

      {(view === 'error' || view === 'denied') && (
        <>
          <p className="text-ink text-sm font-semibold">
            {view === 'error' ? t('error.title') : t('denied.title')}
          </p>
          <p role="alert" className="text-ink text-sm">
            {view === 'error'
              ? t(`error.codes.${toEasyOrdersErrorKey(status?.lastErrorCode)}`)
              : t('denied.body')}
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
    </div>
  )
}
