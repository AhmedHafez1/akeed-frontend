'use client'

import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Info,
  MessageCircleReply,
  Package,
  Send,
  TriangleAlert,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Progress, Skeleton, Tooltip } from '@/shared/ui'
import { lifecycleTone } from '@/features/dashboard/domain/verificationLifecycle'
import { isAttentionVerification } from '@/features/dashboard/domain/verificationWorkload'
import { getStatusTimestamp } from '@/features/dashboard/domain/verificationRow'
import { lifecycleToneClasses } from '../lifecycleToneClasses'
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

interface DashboardCardProps {
  className?: string
  children: React.ReactNode
}

function DashboardCard({ className, children }: DashboardCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className
      )}
    >
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard className="border-amber-100 bg-amber-50 p-5">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="mt-4 h-9 w-16" />
          <Skeleton className="mt-3 h-3 w-32" />
        </DashboardCard>
        <DashboardCard className="p-5">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="mt-5 space-y-4">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </DashboardCard>
        <DashboardCard className="p-5">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="mt-4 h-9 w-16" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </DashboardCard>
      </div>
      <DashboardCard className="p-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-3 h-2 w-full" />
      </DashboardCard>
      <div>
        <DashboardCard className="p-5 sm:p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-5 grid items-center gap-3 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        </DashboardCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <DashboardCard className="h-64 p-5">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </DashboardCard>
        <DashboardCard className="h-64 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-3 w-full" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        </DashboardCard>
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

export function StandaloneStatsSummary({
  stats,
  reportingTimezone,
  isStatsLoading,
  verifications,
  isVerificationsLoading,
  verificationsError,
}: StandaloneStatsSummaryProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()

  if (isStatsLoading && !stats) return <DashboardSkeleton />

  const attentionVerifications = verifications
    .filter((verification) => isAttentionVerification(verification.status))
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
        <DashboardCard className="p-6">
          <h2 className="font-semibold text-slate-950">
            {t('standalone.unavailable.title')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t('standalone.unavailable.description')}
          </p>
        </DashboardCard>
        <AttentionPreview
          verifications={attentionVerifications}
          isLoading={isVerificationsLoading}
          error={verificationsError}
          reportingTimezone={reportingTimezone}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section
        aria-label={t('standalone.kpisLabel')}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FollowUpCard count={stats.totals.needs_attention} locale={locale} />
        <ConfirmationPerformanceCard
          confirmationRate={stats.totals.confirmation_rate}
          replyRate={stats.totals.reply_rate}
          locale={locale}
        />
        <TotalOrdersCard stats={stats} locale={locale} />
      </section>

      <UsageBar usage={stats.usage} locale={locale} />

      <div>
        <VerificationFunnel stats={stats} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AttentionPreview
          verifications={attentionVerifications}
          isLoading={isVerificationsLoading}
          error={verificationsError}
          reportingTimezone={reportingTimezone}
        />
        <OutcomeBreakdown stats={stats} />
      </div>
    </div>
  )
}

function VerificationFunnel({ stats }: { stats: DashboardStats }) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const periodLabel = t(`filters.dateRange.${stats.date_range}`)
  const sentCount = Math.max(0, stats.totals.sent)
  const confirmedCount = Math.max(0, stats.totals.confirmed)
  const canceledCount = Math.max(0, stats.totals.customer_canceled)
  const respondedCount = confirmedCount + canceledCount
  const noResponseCount = Math.max(0, sentCount - respondedCount)
  const clampPercentage = (value: number) =>
    Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  const responseRate = clampPercentage(stats.totals.reply_rate)
  const confirmedRate = clampPercentage(
    respondedCount > 0 ? (confirmedCount / respondedCount) * 100 : 0
  )
  const sent = formatDashboardNumber(sentCount, locale)
  const responded = formatDashboardNumber(respondedCount, locale)
  const noResponse = formatDashboardNumber(noResponseCount, locale)
  const confirmed = formatDashboardNumber(confirmedCount, locale)
  const canceled = formatDashboardNumber(canceledCount, locale)
  const formattedResponseRate = formatDashboardPercent(responseRate, locale)
  const formattedConfirmedRate = formatDashboardPercent(confirmedRate, locale)

  return (
    <DashboardCard className="overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">
            {t('standalone.funnel.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('standalone.funnel.description')}
          </p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          {periodLabel}
        </span>
      </div>

      {sentCount === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 px-5 py-9 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-stone-200">
            <Send aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {t('standalone.funnel.emptyTitle')}
          </p>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {t('standalone.funnel.emptyDescription')}
          </p>
        </div>
      ) : (
        <>
          <p className="sr-only">
            {t('standalone.funnel.summary', {
              sent,
              responded,
              responseRate: formattedResponseRate,
              noResponse,
              confirmed,
              canceled,
            })}
          </p>

          <div className="mt-6 grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.25fr)] md:gap-4">
            <div className="flex min-h-40 flex-col justify-center rounded-xl bg-slate-50 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Send aria-hidden="true" className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-slate-600">
                  {t('metrics.cards.sent')}
                </p>
              </div>
              <p className="mt-3 text-3xl font-medium tracking-tight text-slate-950">
                {sent}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t('standalone.funnel.sentContext')}
              </p>
            </div>

            <FunnelConnector />

            <div className="flex min-h-40 flex-col justify-center rounded-xl bg-slate-50 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <MessageCircleReply aria-hidden="true" className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-slate-600">
                  {t('standalone.funnel.responded')}
                </p>
              </div>
              <p className="mt-3 text-3xl font-medium tracking-tight text-slate-950">
                {responded}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t('standalone.funnel.responseRate', {
                  rate: formattedResponseRate,
                })}
              </p>
            </div>

            <FunnelConnector />

            <div className="flex min-h-40 flex-col justify-center rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-600">
                {t('standalone.funnel.decision')}
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700">
                  <p className="text-sm font-medium">
                    {t('metrics.cards.confirmed')}
                  </p>
                  <p className="text-sm font-semibold">{confirmed}</p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-red-50 px-3 py-2.5 text-red-600">
                  <p className="text-sm font-medium">
                    {t('metrics.cards.canceled')}
                  </p>
                  <p className="text-sm font-semibold">{canceled}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                {t('standalone.funnel.confirmationShare', {
                  rate: formattedConfirmedRate,
                })}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-start">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
              <Clock3 aria-hidden="true" className="h-4 w-4" />
              {t('standalone.funnel.awaitingResponse', {
                count: noResponseCount,
              })}
            </p>
          </div>
        </>
      )}
    </DashboardCard>
  )
}

function FunnelConnector() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center text-slate-400"
    >
      <ArrowDown className="h-5 w-5 md:hidden" />
      <ArrowRight className="hidden h-5 w-5 md:block rtl:rotate-180" />
    </div>
  )
}

function AttentionPreview({
  verifications,
  isLoading,
  error,
  reportingTimezone,
}: {
  verifications: VerificationItem[]
  isLoading: boolean
  error: string | null
  reportingTimezone: string
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()

  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">
            {t('standalone.attention.title')}
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
          <ul className="divide-y divide-stone-100">
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
    </DashboardCard>
  )
}

function OutcomeBreakdown({ stats }: { stats: DashboardStats }) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const outcomes: Array<{
    id: string
    label: string
    value: number
    color: string
  }> = [
    {
      id: 'confirmed',
      label: t('verifications.metrics.confirmed'),
      value: stats.totals.confirmed,
      color: 'bg-emerald-600',
    },
    {
      id: 'canceled',
      label: t('verifications.metrics.canceled'),
      value: stats.totals.canceled,
      color: 'bg-red-500',
    },
    {
      id: 'inProgress',
      label: t('verifications.metrics.inProgress'),
      value: stats.totals.in_progress,
      color: 'bg-slate-400',
    },
    {
      id: 'needsAttention',
      label: t('verifications.metrics.needsAttention'),
      value: stats.totals.needs_attention,
      color: 'bg-amber-500',
    },
  ]
  const outcomeTotal = outcomes.reduce((sum, outcome) => sum + outcome.value, 0)
  const showStackedBar =
    outcomeTotal > 0 &&
    outcomes.filter((outcome) => outcome.value > 0).length > 1

  return (
    <DashboardCard className="p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-950">
        {t('standalone.outcomes.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {t('standalone.outcomes.description')}
      </p>

      {showStackedBar ? (
        <div
          className="mt-5 flex h-3 overflow-hidden rounded-full bg-stone-100"
          aria-label={t('standalone.outcomes.chartLabel')}
          role="img"
        >
          {outcomes.map((outcome) =>
            outcome.value > 0 ? (
              <span
                key={outcome.id}
                className={cn('h-full', outcome.color)}
                style={{ width: `${(outcome.value / outcomeTotal) * 100}%` }}
              />
            ) : null
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-stone-50 p-3 text-sm text-slate-600">
          {t(
            outcomeTotal === 0
              ? 'standalone.outcomes.empty'
              : 'standalone.outcomes.singleOutcome'
          )}
        </p>
      )}

      <dl className="mt-5 divide-y divide-stone-100">
        {outcomes.map((outcome) => (
          <div
            key={outcome.id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <dt className="flex items-center gap-2 text-sm text-slate-600">
              <span
                aria-hidden="true"
                className={cn('h-2.5 w-2.5 rounded-full', outcome.color)}
              />
              {outcome.label}
            </dt>
            <dd className="text-sm font-bold text-slate-950">
              {formatDashboardNumber(outcome.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </DashboardCard>
  )
}

function FollowUpCard({ count, locale }: { count: number; locale: string }) {
  const t = useTranslations('dashboard')

  return (
    <DashboardCard className="border-amber-100 bg-amber-50 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700">
          <TriangleAlert aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-amber-900">
          {t('standalone.attention.title')}
        </p>
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
        {formatDashboardNumber(count, locale)}
      </p>
      <p className="mt-2 text-sm text-amber-800">
        {t('standalone.followUp.description')}
      </p>
    </DashboardCard>
  )
}

function ConfirmationPerformanceCard({
  confirmationRate,
  replyRate,
  locale,
}: {
  confirmationRate: number
  replyRate: number
  locale: string
}) {
  const t = useTranslations('dashboard')
  const confirmationPct = Math.round(confirmationRate)
  const replyPct = Math.round(replyRate)

  return (
    <DashboardCard className="p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <BarChart3 aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-slate-950">
          {t('standalone.performance.title')}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {t('metrics.cards.confirmationRate')}
            </span>
            <span className="font-semibold text-slate-950">
              {formatDashboardPercent(confirmationPct, locale)}
            </span>
          </div>
          <Progress
            value={confirmationPct}
            className="mt-2"
            indicatorClassName="bg-emerald-600"
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {t('metrics.cards.responseRate')}
            </span>
            <span className="font-semibold text-slate-950">
              {formatDashboardPercent(replyPct, locale)}
            </span>
          </div>
          <Progress
            value={replyPct}
            className="mt-2"
            indicatorClassName="bg-violet-600"
          />
        </div>
      </div>
    </DashboardCard>
  )
}

function TotalOrdersCard({
  stats,
  locale,
}: {
  stats: DashboardStats
  locale: string
}) {
  const t = useTranslations('dashboard')
  const rows = [
    {
      id: 'confirmed',
      label: t('verifications.metrics.confirmed'),
      value: stats.totals.confirmed,
      dot: 'bg-emerald-600',
      text: 'text-emerald-700',
    },
    {
      id: 'canceled',
      label: t('verifications.metrics.canceled'),
      value: stats.totals.canceled,
      dot: 'bg-red-500',
      text: 'text-red-600',
    },
    {
      id: 'inProgress',
      label: t('verifications.metrics.inProgress'),
      value: stats.totals.in_progress,
      dot: 'bg-slate-400',
      text: 'text-slate-600',
    },
  ]

  return (
    <DashboardCard className="p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Package aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-slate-950">
          {t('verifications.metrics.total')}
        </p>
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
        {formatDashboardNumber(stats.totals.total, locale)}
      </p>
      <dl className="mt-4 space-y-2 border-t border-stone-100 pt-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between text-sm"
          >
            <dt className="flex items-center gap-2 text-slate-600">
              <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', row.dot)} />
              {row.label}
            </dt>
            <dd className={cn('font-semibold', row.text)}>
              {formatDashboardNumber(row.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </DashboardCard>
  )
}

function UsageBar({
  usage,
  locale,
}: {
  usage: DashboardStats['usage']
  locale: string
}) {
  const t = useTranslations('dashboard')
  const isUnlimited = usage.limit <= 0
  const percent = isUnlimited
    ? 0
    : Math.min(100, Math.round((usage.used / usage.limit) * 100))

  return (
    <DashboardCard className="p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-700">
          {isUnlimited
            ? `${t('standalone.usage.title')}: ${t('standalone.usage.unlimited')}`
            : t('standalone.usage.summary', {
                used: formatDashboardNumber(usage.used, locale),
                limit: formatDashboardNumber(usage.limit, locale),
              })}
        </p>
        <Tooltip content={t('standalone.usage.description')}>
          <Info aria-hidden="true" className="h-4 w-4 text-slate-400" />
          <span className="sr-only">{t('standalone.usage.description')}</span>
        </Tooltip>
      </div>
      {!isUnlimited && <Progress value={percent} className="mt-3" />}
    </DashboardCard>
  )
}
