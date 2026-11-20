'use client'

import { useId, type ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { creditsToMinor, formatBalanceParts } from '@/shared/lib/balanceMoney'
import { cn } from '@/shared/lib/utils'
import { InfoHint, akCard, akPill, Skeleton } from '@/shared/ui'
import {
  resolveBalanceState,
  type BalanceState,
  type BalanceTone,
} from '../../domain/balanceState'
import {
  creditsAsMoney,
  formatCredits,
  formatMoney,
  formatShortDate,
} from '../../domain/billingFormatters'
import type { CreditSummary } from '../../domain/billing.types'
import { messagePrices } from '../../domain/messageCoverage'
import { runwayDays } from '../../domain/usageInsights'
import type { BillingUsage } from '../../domain/useBillingUsage'
import { DailyUsageBars } from './DailyUsageBars'

const TONE_TEXT: Record<BalanceTone, string> = {
  brand: 'text-brand',
  warning: 'text-ak-warning',
  danger: 'text-ak-danger',
}

const STATE_ICON: Record<BalanceState, LucideIcon> = {
  healthy: CheckCircle2,
  low: AlertTriangle,
  zero: AlertCircle,
  debt: AlertCircle,
  suspended: AlertCircle,
  notProvisioned: AlertCircle,
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-4 sm:px-6">
      <dt className="text-ak-caption text-ink-muted">{label}</dt>
      <dd className="text-ink flex min-h-7.5 items-center text-[1.375rem] leading-7.5 font-semibold">
        {children}
      </dd>
    </div>
  )
}

interface BalanceCardProps {
  summary: CreditSummary
  usage: BillingUsage
  /**
   * Show what each number costs and spent: the merchant can connect their
   * own number, has one, or has sent from it this month.
   */
  showSenders?: boolean
}

/**
 * The balance as the page's one hero number, its state in a word, how long it
 * lasts, and the usage behind that. The number takes the state's colour, so
 * a low or empty balance is seen before it is read.
 */
export function BalanceCard({
  summary,
  usage,
  showSenders = false,
}: BalanceCardProps) {
  const t = useTranslations('billing.balance')
  const { locale } = useLocaleInfo()
  const { price } = summary
  const money = (credits: number) => creditsAsMoney(credits, price, locale)
  const prices = messagePrices(price)
  const hero = formatBalanceParts(
    summary.balanceMinor ??
      creditsToMinor(summary.availableCredits, price.unitPriceMinor),
    price.currency,
    locale
  )
  const heroCurrency = (
    <span className="text-ink-muted text-[0.9375rem] font-semibold">
      {hero.currency}
    </span>
  )
  const headingId = useId()
  const { state, tone } = resolveBalanceState(summary)
  const StateIcon = STATE_ICON[state]

  const ready = usage.status === 'ready' ? usage : null
  const senders =
    showSenders || (ready !== null && ready.bySender.ownNumber > 0)
  /** Credits one message used from each number, to count messages sent. */
  const perMessage = {
    akeed: price.creditsPerMessage,
    ownNumber: price.ownNumberCreditsPerMessage ?? 1,
  }

  // A runway only means something while messages can still go out.
  const days =
    (state === 'healthy' || state === 'low') && ready
      ? runwayDays(
          summary.availableCredits,
          ready.usedThisMonth,
          ready.asOf ? new Date(ready.asOf) : new Date()
        )
      : null
  const caption =
    state === 'zero' || state === 'debt'
      ? t('runwayPaused')
      : days !== null
        ? t('runway', { count: days, days: formatCredits(days, locale) })
        : null

  // Never a «0» standing in for a number that has not arrived.
  const usagePlaceholder =
    usage.status === 'loading' ? (
      <Skeleton className="h-5 w-16" />
    ) : (
      <span className="text-ink-muted">—</span>
    )

  return (
    <section className={akCard} aria-labelledby={headingId}>
      <div className="grid items-center gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-7">
        <div className="flex flex-col gap-1.5">
          <h2
            id={headingId}
            className="text-ak-body text-ink-muted font-semibold"
          >
            {t('available')}
          </h2>
          <p className="flex">
            {/* The parts in reading order, kept left to right in RTL too. */}
            <span dir="ltr" className="inline-flex items-baseline gap-2">
              {hero.currencyFirst && heroCurrency}
              <span
                className={cn('text-ak-hero tabular-nums', TONE_TEXT[tone])}
              >
                {hero.amount}
              </span>
              {!hero.currencyFirst && heroCurrency}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={akPill({ tone })}>
              <StateIcon
                aria-hidden="true"
                strokeWidth={2.25}
                className="size-3 shrink-0"
              />
              {t(`state.${state}`)}
            </span>
            {caption && (
              <span className="text-ak-caption text-ink-muted">{caption}</span>
            )}
          </div>
        </div>

        {usage.status === 'loading' && (
          <Skeleton className="rounded-ak-control hidden h-25 w-65 sm:block" />
        )}
        {ready && (
          <DailyUsageBars
            price={price}
            daily={ready.daily}
            split={senders ? ready.dailyBySender : undefined}
          />
        )}
      </div>

      <dl className="border-line divide-line grid divide-y border-t sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0">
        <Stat label={t('usedThisMonth')}>
          {ready ? (
            <bdi className="tabular-nums">{money(ready.usedThisMonth)}</bdi>
          ) : (
            usagePlaceholder
          )}
        </Stat>
        <Stat label={t('lastPurchase')}>
          {!ready ? (
            usagePlaceholder
          ) : ready.lastPurchase ? (
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <bdi className="tabular-nums">
                {formatMoney(
                  ready.lastPurchase.totalMinor,
                  ready.lastPurchase.currency,
                  locale
                )}
              </bdi>
              <span className="text-ak-caption text-ink-muted font-normal">
                · {formatShortDate(ready.lastPurchase.createdAt, locale)}
              </span>
            </span>
          ) : (
            <span className="text-ak-body text-ink-muted font-normal">
              {t('noPurchase')}
            </span>
          )}
        </Stat>
        <Stat label={t('unitPrice')}>
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            <bdi className="tabular-nums">
              {formatMoney(prices.akeed, price.currency, locale)}
            </bdi>
            {senders && prices.ownNumber !== null && (
              <span className="text-ak-caption text-ink-muted font-normal">
                ·{' '}
                {t.rich('ownNumberPrice', {
                  price: formatMoney(prices.ownNumber, price.currency, locale),
                  amount: (chunks) => (
                    <bdi className="tabular-nums">{chunks}</bdi>
                  ),
                })}
              </span>
            )}
          </span>
        </Stat>
      </dl>

      {senders && (
        <div className="border-line border-t px-5 py-4 sm:px-6">
          <div className="space-y-2">
            <h3 className="text-ak-caption text-ink-muted flex items-center gap-1">
              {t('senders.usedHeading')}
              <InfoHint
                label={t('senders.usedHeading')}
                content={t('senders.usageNote')}
              />
            </h3>
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              {(['akeed', 'ownNumber'] as const).map((sender) => (
                <div key={sender} className="flex flex-col gap-0.5">
                  <dt className="text-ak-caption text-ink-muted flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-2 rounded-full',
                        sender === 'akeed' ? 'bg-brand' : 'bg-brand-line'
                      )}
                    />
                    {t(`senders.${sender}`)}
                  </dt>
                  <dd className="text-ink text-[1.0625rem] font-semibold">
                    {ready ? (
                      <>
                        <bdi className="tabular-nums">
                          {money(ready.bySender[sender])}
                        </bdi>{' '}
                        <span className="text-ak-caption text-ink-muted font-normal">
                          {t('senders.messages', {
                            count: Math.floor(
                              ready.bySender[sender] / perMessage[sender]
                            ),
                            formatted: formatCredits(
                              Math.floor(
                                ready.bySender[sender] / perMessage[sender]
                              ),
                              locale
                            ),
                          })}
                        </span>
                      </>
                    ) : (
                      usagePlaceholder
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </section>
  )
}
