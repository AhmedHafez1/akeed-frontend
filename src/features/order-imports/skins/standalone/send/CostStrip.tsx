'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui'
import type { OrderImportStartQuote } from '../../../api/orderImportsApi'
import {
  balanceAfterFirstMessages,
  shortfallOf,
} from '../../../domain/releaseSummary'

/**
 * رسائل الآن · رصيدك بعد الإرسال · المدة المتوقعة. Three stats side by side;
 * list rows on phones. Nothing is shown until the quote is in, so a count
 * never flashes as 0.
 */
export function CostStrip({
  quote,
}: {
  quote: OrderImportStartQuote | undefined
}) {
  const t = useTranslations('orderImport.send.cost')

  if (!quote)
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-card border-border grid gap-px overflow-hidden border sm:grid-cols-3"
      >
        <span className="sr-only">{t('loading')}</span>
        {[0, 1, 2].map((index) => (
          <div key={index} className="bg-card space-y-2 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    )

  const shortfall = shortfallOf(quote)
  const after = balanceAfterFirstMessages(quote)
  const minutes = quote.estimatedDurationMinutes
  const duration =
    minutes < 60
      ? t('minutes', { minutes: Math.max(Math.round(minutes), 0) })
      : t('hours', { hours: Math.round(minutes / 60) })
  const quiet =
    quote.quietHours.enabled && quote.quietHours.start && quote.quietHours.end
      ? t('quiet', {
          window: `${quote.quietHours.start}–${quote.quietHours.end}`,
        })
      : null

  return (
    <dl
      aria-label={t('label')}
      className="rounded-card border-border bg-card divide-border grid divide-y border sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse"
    >
      <Stat
        label={t('messages')}
        value={quote.estimatedCreditsMin}
        note={
          quote.estimatedCreditsMax > quote.estimatedCreditsMin
            ? t('upTo', { max: quote.estimatedCreditsMax })
            : t('noFollowUp')
        }
      />
      {quote.accountingMode === 'prepaid_credit' ? (
        <Stat
          label={t('balance')}
          value={shortfall ? 0 : (after ?? 0)}
          critical={!!shortfall}
          note={
            shortfall
              ? t('short', { shortfall: shortfall.shortfall ?? 0 })
              : t('of', { available: quote.creditsAvailable ?? 0 })
          }
        />
      ) : (
        <Stat
          label={t('plan')}
          value={Math.max(
            (quote.slotsRemaining ?? 0) - quote.estimatedCreditsMin,
            0
          )}
          note={t('planOf', { slots: quote.slotsRemaining ?? 0 })}
        />
      )}
      <Stat
        label={t('duration')}
        value={duration}
        note={
          <>
            {t('rate', { rate: quote.ratePerMinute })}
            {quiet && <span className="block">{quiet}</span>}
          </>
        }
      />
    </dl>
  )
}

function Stat({
  label,
  value,
  note,
  critical = false,
}: {
  label: string
  value: number | string
  note: ReactNode
  critical?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 sm:block sm:space-y-1 sm:p-4">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-end sm:text-start">
        <span
          className={cn(
            'block text-base font-bold tabular-nums sm:text-2xl',
            critical ? 'text-destructive' : 'text-foreground'
          )}
        >
          {typeof value === 'number' ? (
            <bdi dir="ltr">{value.toLocaleString('en')}</bdi>
          ) : (
            value
          )}
        </span>
        <span className="text-muted-foreground block text-xs leading-5">
          {note}
        </span>
      </dd>
    </div>
  )
}
