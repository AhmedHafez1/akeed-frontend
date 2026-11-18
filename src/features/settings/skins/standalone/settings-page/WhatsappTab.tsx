'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, CircleAlert, Loader2, MessageCircle } from 'lucide-react'
import {
  serverErrorKey,
  useWhatsappTab,
  type WhatsappTabModel,
  type WhatsappProgressRow,
} from '@/features/whatsapp-connect'
import { cn } from '@/shared/lib/utils'
import {
  akButton,
  akCard,
  akLink,
  akPill,
  DocsLink,
  Skeleton,
} from '@/shared/ui'
import { WhatsappDisconnectDialog } from './WhatsappDisconnectDialog'

/** The own-number connection has one identity and three current status rows. */
export function WhatsappTab() {
  const t = useTranslations('whatsappConnect.tab')
  const model = useWhatsappTab()
  const [confirming, setConfirming] = useState(false)
  if (model.status === 'loading')
    return (
      <div className={cn(akCard, 'space-y-4 p-6')} aria-busy="true">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  if (model.status === 'error')
    return (
      <div role="alert" className={cn(akCard, 'space-y-4 p-6')}>
        <h2 className="text-ak-section text-ink">{t('load.title')}</h2>
        <p className="text-ak-body text-ink-muted">{t('load.body')}</p>
        <button
          type="button"
          className={akButton({ variant: 'secondary' })}
          onClick={model.retry}
        >
          {t('load.retry')}
        </button>
      </div>
    )
  const view = model.view
  if (view.kind === 'hidden') return null
  return (
    <section
      className={cn(akCard, 'max-w-190 min-w-0')}
      aria-label={t('number.title')}
    >
      {view.kind === 'unconnected' ? (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <h2 className="text-ak-section text-ink">{t('number.title')}</h2>
            <p className="text-ak-body text-ink-muted">{t('connect.body')}</p>
          </div>
          <ConnectAction
            model={model}
            canConnect={view.canConnect}
            label={t('connect.action')}
          />
        </div>
      ) : (
        <>
          <header className="flex items-center gap-3.5 p-5 sm:p-6">
            <span
              aria-hidden="true"
              className="border-brand-line bg-brand-soft text-brand-ink rounded-ak-control flex size-11 shrink-0 items-center justify-center border"
            >
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-ak-caption text-ink-muted">
                {t('number.title')}
              </p>
              <h2 className="text-ink text-lg font-semibold">
                <bdi dir="ltr" className="break-words tabular-nums">
                  {view.phone ?? t('number.noNumber')}
                </bdi>
              </h2>
            </div>
          </header>
          {view.progress.rows.length > 0 ? (
            <div className="px-5 sm:px-6">
              <ol
                aria-label={t('progress.label')}
                className="m-0 list-none p-0"
              >
                {view.progress.rows.map((row) => (
                  <ProgressRow
                    key={row.id}
                    row={row}
                    isOwner={view.isOwner}
                    onReconnect={() => setConfirming(true)}
                  />
                ))}
              </ol>
              {view.progress.coverage && (
                <p className="text-ak-caption text-ink-muted pb-5">
                  {t('progress.coverage.' + view.progress.coverage)}
                </p>
              )}
            </div>
          ) : (
            <div className="border-line mx-5 space-y-3 border-t py-5 sm:mx-6">
              <h3 className="text-ak-section text-ink">
                {t('reconnect.title')}
              </h3>
              <p className="text-ak-body text-ink-muted">
                {t(
                  view.banners.some(
                    (banner) => banner.key === 'disconnect.primary_inactivity'
                  )
                    ? 'progress.issues.inactive'
                    : 'reconnect.body'
                )}
              </p>
              {view.canReconnect ? (
                <ConnectAction
                  model={model}
                  canConnect
                  label={t('reconnect.action')}
                />
              ) : (
                <p className="text-ak-caption text-ink-muted">
                  {t(
                    view.isOwner
                      ? view.reconnectNeedsDisconnect
                        ? 'banners.reconnectFirst'
                        : 'progress.issues.unavailable'
                      : 'banners.askOwner'
                  )}
                </p>
              )}
            </div>
          )}
          {model.disconnect.result && view.state === 'disconnected' && (
            <div
              className="border-line mx-5 space-y-3 border-t py-5 sm:mx-6"
              role="status"
            >
              <p className="text-ak-body text-ink">{t('disconnect.done')}</p>
              {model.disconnect.result.businessAppSteps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-ak-caption text-ink-muted">
                    {t('disconnect.appStepsIntro')}
                  </p>
                  <ol className="text-ak-caption text-ink list-decimal space-y-1 ps-5">
                    {model.disconnect.result.businessAppSteps.map((step) => (
                      <li key={step}>
                        {t.has('disconnect.appSteps.' + step)
                          ? t('disconnect.appSteps.' + step)
                          : t('disconnect.cleanupManual')}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {model.disconnect.result.providerCleanup ===
                'manual_required' && (
                <p className="text-ak-caption text-ak-warning">
                  {t('disconnect.cleanupManual')}
                </p>
              )}
            </div>
          )}
          <footer className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 sm:px-6">
            {view.state !== 'disconnected' ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={akButton({ variant: 'secondary', size: 'row' })}
                  disabled={!view.canDisconnect || model.disconnect.isPending}
                  onClick={() => setConfirming(true)}
                >
                  {t('disconnect.action')}
                </button>
                {!view.canDisconnect && (
                  <span className="text-ak-caption text-ink-muted">
                    {t('connect.ownerOnly')}
                  </span>
                )}
              </div>
            ) : (
              <span />
            )}
            <DocsLink
              article="ownWhatsappNumber"
              className={cn(akLink, 'text-ak-caption text-ink-muted')}
            >
              {t('help')}
            </DocsLink>
          </footer>
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
        </>
      )}
    </section>
  )
}

function ProgressRow({
  row,
  isOwner,
  onReconnect,
}: {
  row: WhatsappProgressRow
  isOwner: boolean
  onReconnect: () => void
}) {
  const t = useTranslations('whatsappConnect.tab.progress')
  const tone = row.tone === 'success' ? 'brand' : row.tone
  return (
    <li className="border-line grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-2.5 border-t py-4 sm:gap-x-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-6 items-center justify-center rounded-full border',
          row.done
            ? 'border-brand-line bg-brand-soft text-brand-ink'
            : row.tone === 'warning'
              ? 'border-ak-warning-line bg-ak-warning-soft text-ak-warning'
              : 'border-line-strong text-ink-muted'
        )}
      >
        {row.done ? (
          <Check className="size-3.5" />
        ) : row.issue && row.tone === 'warning' ? (
          <CircleAlert className="size-3.5" />
        ) : row.tone === 'warning' ? (
          <span className="size-1.5 rounded-full bg-current" />
        ) : null}
      </span>
      <span className="text-ak-body text-ink min-w-0 text-[0.8125rem] font-medium sm:text-sm">
        {t('labels.' + row.id)}
      </span>
      <span
        className={cn(
          akPill({ tone }),
          'max-w-32 text-center whitespace-normal sm:max-w-44'
        )}
      >
        {t('statuses.' + row.status)}
      </span>
      {row.issue && (
        <div
          className="text-ak-caption text-ink-muted col-span-2 col-start-2 mt-2 space-y-1"
          role={row.tone === 'warning' ? 'status' : undefined}
        >
          <p>{t('issues.' + row.issue)}</p>
          {row.action === 'whatsapp_manager' && (
            <a
              href="https://business.facebook.com/wa/manage/"
              target="_blank"
              rel="noopener noreferrer"
              className={akLink}
            >
              {t('actions.manager')}
            </a>
          )}
          {row.action === 'support' && (
            <DocsLink article="ownWhatsappNumber" className={akLink}>
              {t('actions.help')}
            </DocsLink>
          )}
          {row.action === 'reconnect' &&
            (isOwner ? (
              <button type="button" className={akLink} onClick={onReconnect}>
                {t('actions.reconnect')}
              </button>
            ) : (
              <p>{t('actions.askOwner')}</p>
            ))}
        </div>
      )}
    </li>
  )
}

function ConnectAction({
  model,
  canConnect,
  label,
}: {
  model: WhatsappTabModel
  canConnect: boolean
  label: string
}) {
  const t = useTranslations('whatsappConnect')
  const entry = model.entry
  const opening = entry.status === 'opening'
  return (
    <div className="space-y-2">
      <button
        type="button"
        className={cn(akButton({ variant: 'primary' }), 'w-full sm:w-auto')}
        disabled={!canConnect || opening}
        onClick={entry.open}
      >
        {opening && (
          <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
        )}
        {opening ? t('tab.connect.opening') : label}
      </button>
      {!canConnect && (
        <p className="text-ak-caption text-ink-muted">
          {t('tab.connect.ownerOnly')}
        </p>
      )}
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
          <p className="text-ak-danger">
            {t('errors.' + serverErrorKey(entry.errorCode))}
          </p>
        )}
      </div>
    </div>
  )
}
