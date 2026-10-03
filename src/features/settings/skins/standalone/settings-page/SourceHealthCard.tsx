'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import {
  sourceHealthOptions,
  type SourceHealth,
} from '@/features/settings/api/sourceHealthApi'
import { cn } from '@/shared/lib/utils'
import { Skeleton, akButton } from '@/shared/ui'
import { settingsRowPadding, settingsRowTitle } from './SettingsSection'

/** One signal: its name, what Akeed last saw, and a note when one helps. */
function HealthRow({
  title,
  value,
  note,
  attention = false,
}: {
  title: string
  value: ReactNode
  note?: ReactNode
  /** The signal needs the merchant; quiet signals stay in plain ink. */
  attention?: boolean
}) {
  return (
    <div
      className={cn(
        'border-line border-t first:border-t-0',
        settingsRowPadding
      )}
    >
      <dt className={settingsRowTitle}>{title}</dt>
      <dd
        className={cn(
          'text-ak-body mt-0.5',
          attention ? 'text-ak-warning font-semibold' : 'text-ink'
        )}
      >
        {value}
      </dd>
      {note && (
        <dd className="text-ak-caption text-ink-muted mt-0.5">{note}</dd>
      )}
    </div>
  )
}

/**
 * The source's health as separate signals: credentials, the last event
 * accepted, processing failures, what is waiting, and updates the store did
 * not take. Each has its own cause, so there is no single "healthy" verdict,
 * and a store that has sent nothing lately is described, not flagged.
 */
export function SourceHealthCard() {
  const t = useTranslations('settings.standalone.page.store.health')
  const locale = useLocale()
  const query = useQuery(sourceHealthOptions())

  if (query.isPending) {
    return (
      <div aria-busy="true" className={cn('space-y-3', settingsRowPadding)}>
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-5 w-56 max-w-full" />
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton className="h-5 w-40 max-w-full" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className={cn('space-y-3', settingsRowPadding)}>
        <p role="alert" className="text-ak-body text-ink">
          {t('loadError')}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className={akButton({ variant: 'secondary' })}
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  const health: SourceHealth = query.data
  const formatWhen = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      numberingSystem: 'latn',
    }).format(new Date(iso))
  const days = health.windowDays
  const { events, processing, backlog, remoteSync, delivery } = health
  const supported = health.capabilities.filter((item) => item.supported)
  const unsupported = health.capabilities.filter((item) => !item.supported)

  return (
    <dl>
      {health.credentials && (
        <HealthRow
          title={t('credentials.title')}
          value={t(`credentials.${health.credentials.status}`)}
          note={
            health.credentials.status === 'removed'
              ? undefined
              : t('credentials.note')
          }
          attention={health.credentials.status === 'rejected'}
        />
      )}

      <HealthRow
        title={t('lastEvent.title')}
        value={
          events.lastAcceptedAt
            ? formatWhen(events.lastAcceptedAt)
            : t('lastEvent.none')
        }
        note={
          events.lastAcceptedAt
            ? t('lastEvent.recent', { count: events.acceptedCount, days })
            : t('lastEvent.noneNote')
        }
      />

      {delivery && (
        <HealthRow
          title={t('delivery.title')}
          value={
            delivery.secretsMissing
              ? t('delivery.secretsMissing')
              : delivery.rejectedCount > 0
                ? t('delivery.rejected', { count: delivery.rejectedCount })
                : t('delivery.none')
          }
          note={
            delivery.lastRejectedAt
              ? t('delivery.lastRejected', {
                  when: formatWhen(delivery.lastRejectedAt),
                })
              : undefined
          }
          attention={delivery.secretsMissing || delivery.rejectedCount > 0}
        />
      )}

      <HealthRow
        title={t('processing.title')}
        value={
          processing.failedCount > 0
            ? t('processing.failed', { count: processing.failedCount, days })
            : t('processing.none', { days })
        }
        note={
          processing.lastFailedAt
            ? t('processing.lastFailed', {
                when: formatWhen(processing.lastFailedAt),
              })
            : undefined
        }
        attention={processing.failedCount > 0}
      />

      <HealthRow
        title={t('backlog.title')}
        value={
          backlog.waitingCount > 0
            ? t('backlog.waiting', { count: backlog.waitingCount })
            : t('backlog.none')
        }
        note={
          backlog.oldestWaitingAt
            ? t('backlog.oldest', { when: formatWhen(backlog.oldestWaitingAt) })
            : undefined
        }
      />

      <HealthRow
        title={t('remoteSync.title')}
        value={
          remoteSync.failedCount > 0
            ? t('remoteSync.failed', { count: remoteSync.failedCount, days })
            : t('remoteSync.none', { days })
        }
        note={
          <>
            {remoteSync.pendingCount > 0 && (
              <span className="block">
                {t('remoteSync.pending', { count: remoteSync.pendingCount })}
              </span>
            )}
            <span className="block">
              {remoteSync.requiresAssistance
                ? t('remoteSync.assistance')
                : t('remoteSync.note')}
            </span>
          </>
        }
        attention={remoteSync.failedCount > 0}
      />

      <HealthRow
        title={t('capabilities.title')}
        value={
          supported.length > 0
            ? t('capabilities.some')
            : health.connectionState === 'disconnected'
              ? t('capabilities.disconnected')
              : t('capabilities.none')
        }
        note={
          <>
            {supported.length > 0 && (
              <span className="block">
                {t('capabilities.supported', {
                  list: supported
                    .map((item) => t(`capabilities.actions.${item.action}`))
                    .join(t('capabilities.separator')),
                })}
              </span>
            )}
            {supported.length > 0 && unsupported.length > 0 && (
              <span className="block">
                {t('capabilities.unsupported', {
                  list: unsupported
                    .map((item) => t(`capabilities.actions.${item.action}`))
                    .join(t('capabilities.separator')),
                })}
              </span>
            )}
            <span className="block">{t('capabilities.note')}</span>
          </>
        }
      />
    </dl>
  )
}
