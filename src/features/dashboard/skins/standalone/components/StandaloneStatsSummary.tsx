'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Gauge } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Card, Progress, Skeleton, Tooltip } from '@/shared/ui'
import { lifecycleTone } from '@/features/dashboard/domain/verificationLifecycle'
import { filterAdmitsStatus } from '@/features/dashboard/domain/verificationFilters'
import { getStatusTimestamp } from '@/features/dashboard/domain/verificationRow'
import { lifecycleToneClasses } from '../lifecycleToneClasses'
import { VerificationOutcomePanel } from './VerificationOutcomePanel'
import {
  formatDashboardNumber,
  formatDashboardPercent,
} from '@/features/dashboard/lib/dashboardFormatters'
import type {
  DashboardStats,
  VerificationItem,
} from '@/features/dashboard/model/dashboard.model'

interface StandaloneStatsSummaryProps {
  stats: DashboardStats | null
  reportingTimezone: string
  isStatsLoading: boolean
  verifications: VerificationItem[]
  isVerificationsLoading: boolean
  verificationsError: string | null
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Card className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="mt-5 h-14 w-28" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="mx-auto h-40 w-40 shrink-0 rounded-full sm:mx-10 sm:h-52 sm:w-52 lg:mx-14" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="h-64 p-5">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </Card>
        <Card className="h-64 p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-6 space-y-6">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function formatOrderDate(
  value: string | null,
  locale: string,
  reportingTimezone: string,
  unavailableLabel: string
): string {
  if (!value) return unavailableLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return unavailableLabel

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: reportingTimezone,
  }).format(date)
}

/**
 * The confirmation rates, measured against the orders that could answer.
 *
 * Only *settled* verifications count — the ones that reached the customer and
 * will not change on their own. A silent order therefore counts against the
 * reply rate, which is the entire point of measuring one; an order sent ten
 * minutes ago does not, because it has not had its chance yet and letting it
 * in makes the rate swing with traffic rather than with customer behaviour.
 * Undelivered orders are excluded in the other direction: nobody declined to
 * answer a message they never received.
 */
function deriveConfirmationRates(totals: DashboardStats['totals']) {
  const undelivered = Math.max(0, totals.failed)
  // needs_attention is failed + expired + no_reply; the remainder is the part
  // that reached the customer and went unanswered.
  const silent = Math.max(0, totals.needs_attention - undelivered)
  const settled = totals.confirmed + totals.canceled + silent
  const replied = totals.confirmed + totals.canceled

  return {
    settled,
    silent,
    undelivered,
    confirmationRate: settled > 0 ? (totals.confirmed / settled) * 100 : 0,
    replyRate: settled > 0 ? (replied / settled) * 100 : 0,
  }
}

export function StandaloneStatsSummary({
  stats,
  reportingTimezone,
  isStatsLoading,
  verifications,
  isVerificationsLoading,
  verificationsError,
}: StandaloneStatsSummaryProps) {
  const t = useTranslations('dashboard')

  if (isStatsLoading && !stats) return <DashboardSkeleton />

  const attentionVerifications = verifications
    .filter((verification) =>
      filterAdmitsStatus('needs_attention', verification.status)
    )
    .toSorted((left, right) => {
      const leftTime = new Date(
        getStatusTimestamp(left) ?? left.created_at ?? 0
      ).getTime()
      const rightTime = new Date(
        getStatusTimestamp(right) ?? right.created_at ?? 0
      ).getTime()
      return rightTime - leftTime
    })
    .slice(0, 3)

  if (!stats) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-950">
            {t('standalone.unavailable.title')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t('standalone.unavailable.description')}
          </p>
        </Card>
        <AttentionPreview
          verifications={attentionVerifications}
          count={null}
          isLoading={isVerificationsLoading}
          error={verificationsError}
          reportingTimezone={reportingTimezone}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <VerificationOutcomePanel
        stats={stats}
        label={t('standalone.kpisLabel')}
        showChart
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <AttentionPreview
          verifications={attentionVerifications}
          count={stats.totals.needs_attention}
          isLoading={isVerificationsLoading}
          error={verificationsError}
          reportingTimezone={reportingTimezone}
        />
        <ConfirmationPerformanceCard stats={stats} />
      </div>
    </div>
  )
}

function AttentionPreview({
  verifications,
  count,
  isLoading,
  error,
  reportingTimezone,
}: {
  verifications: VerificationItem[]
  count: number | null
  isLoading: boolean
  error: string | null
  reportingTimezone: string
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()

  return (
    <Card>
      <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
            {t('standalone.attention.title')}
            {count !== null && count > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 tabular-nums">
                {formatDashboardNumber(count, locale)}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('standalone.attention.description')}
          </p>
        </div>
        <Link
          href={`${withLocale('/verifications', locale)}?status=needs_attention`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t('standalone.attention.viewAll')}
          <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>

      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3 py-5" aria-busy="true">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <p role="status" className="py-8 text-center text-sm text-slate-600">
            {t('standalone.attention.unavailable')}
          </p>
        ) : verifications.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {t('standalone.attention.emptyTitle')}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t('standalone.attention.emptyDescription')}
            </p>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {verifications.map((verification) => (
              <li
                key={verification.id}
                className="grid gap-2 py-4 sm:grid-cols-[minmax(90px,0.65fr)_minmax(120px,1fr)_auto] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {verification.order_number
                      ? `#${verification.order_number}`
                      : t('table.orderFallbackPrefix')}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                    {formatOrderDate(
                      verification.created_at,
                      locale,
                      reportingTimezone,
                      t('standalone.attention.dateUnavailable')
                    )}
                  </p>
                </div>
                <p className="truncate text-sm text-slate-700">
                  {verification.customer_name || t('table.unknownCustomer')}
                </p>
                <span
                  className={cn(
                    'w-fit rounded-lg border px-2.5 py-1 text-xs font-semibold',
                    lifecycleToneClasses[lifecycleTone(verification.status)]
                  )}
                >
                  {t(`verificationStatus.${verification.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function ConfirmationPerformanceCard({ stats }: { stats: DashboardStats }) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const { settled, silent, undelivered, confirmationRate, replyRate } =
    deriveConfirmationRates(stats.totals)

  const rates = [
    {
      id: 'confirmation',
      label: t('metrics.cards.confirmationRate'),
      value: Math.round(confirmationRate),
      indicator: 'bg-emerald-600',
    },
    {
      id: 'reply',
      label: t('metrics.cards.responseRate'),
      value: Math.round(replyRate),
      indicator: 'bg-violet-600',
    },
  ]

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Gauge aria-hidden="true" className="h-5 w-5" />
        </span>
        <h2 className="text-base font-bold text-slate-950">
          {t('standalone.performance.title')}
        </h2>
      </div>

      {settled === 0 ? (
        <p className="bg-muted mt-5 rounded-xl p-3 text-sm text-slate-600">
          {t('standalone.performance.basisEmpty')}
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-4">
            {rates.map((rate) => (
              <div key={rate.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-slate-600">{rate.label}</span>
                  <span className="text-xl font-bold text-slate-950 tabular-nums">
                    {formatDashboardPercent(rate.value, locale)}
                  </span>
                </div>
                <Progress
                  value={rate.value}
                  className="mt-2"
                  indicatorClassName={rate.indicator}
                />
              </div>
            ))}
          </div>

          <div className="border-border mt-auto space-y-2.5 border-t pt-4">
            <p className="text-caption text-slate-500">
              {t('standalone.performance.basis', { count: settled })}
            </p>
            <PerformanceFootnote
              label={t('standalone.performance.silent')}
              hint={t('standalone.performance.silentHint')}
              value={formatDashboardNumber(silent, locale)}
              tone={silent > 0 ? 'text-amber-800' : 'text-slate-400'}
            />
            {undelivered > 0 && (
              <PerformanceFootnote
                label={t('standalone.performance.undelivered')}
                hint={t('standalone.performance.undeliveredHint')}
                value={formatDashboardNumber(undelivered, locale)}
                tone="text-slate-600"
              />
            )}
          </div>
        </>
      )}
    </Card>
  )
}

/**
 * A figure the rates depend on, with the reason it counts (or does not).
 *
 * Shown because a rate is only trustworthy when its denominator is visible —
 * "100% replied" means nothing until you can see how many orders were asked.
 */
function PerformanceFootnote({
  label,
  hint,
  value,
  tone,
}: {
  label: string
  hint: string
  value: string
  tone: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <Tooltip content={hint}>
        <span className="cursor-help text-slate-600 underline decoration-dotted underline-offset-4">
          {label}
        </span>
      </Tooltip>
      <span className={cn('font-semibold tabular-nums', tone)}>{value}</span>
    </div>
  )
}
