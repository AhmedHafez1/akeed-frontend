'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Package,
  TriangleAlert,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Progress, Skeleton } from '@/shared/ui'
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
  href?: string
}

function DashboardCard({ className, children, href }: DashboardCardProps) {
  const cardClassName = cn(
    'rounded-2xl border border-border bg-white shadow-raised',
    className
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cardClassName,
          'block transition hover:border-emerald-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none'
        )}
      >
        {children}
      </Link>
    )
  }

  return <section className={cardClassName}>{children}</section>
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

  const totalSubmittedToCustomer =
    stats.totals.confirmed + stats.totals.canceled + stats.totals.in_progress
  const confirmationRate =
    totalSubmittedToCustomer > 0
      ? (stats.totals.confirmed / totalSubmittedToCustomer) * 100
      : 0
  const replyRate =
    totalSubmittedToCustomer > 0
      ? ((stats.totals.confirmed + stats.totals.canceled) /
          totalSubmittedToCustomer) *
        100
      : 0
  return (
    <div className="space-y-5">
      <section
        aria-label={t('standalone.kpisLabel')}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FollowUpCard count={stats.totals.needs_attention} locale={locale} />
        <ConfirmationPerformanceCard
          confirmationRate={confirmationRate}
          replyRate={replyRate}
          locale={locale}
        />
        <TotalOrdersCard stats={stats} locale={locale} />
      </section>

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
      <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
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
          className="bg-muted mt-5 flex h-3 overflow-hidden rounded-full"
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
        <p className="bg-muted mt-5 rounded-xl p-3 text-sm text-slate-600">
          {t(
            outcomeTotal === 0
              ? 'standalone.outcomes.empty'
              : 'standalone.outcomes.singleOutcome'
          )}
        </p>
      )}

      <dl className="divide-border mt-5 divide-y">
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
    <DashboardCard
      className="border-amber-100 bg-amber-50 p-5"
      href={`${withLocale('/verifications', locale)}?status=needs_attention`}
    >
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
      <dl className="border-border mt-4 space-y-2 border-t pt-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between text-sm"
          >
            <dt className="flex items-center gap-2 text-slate-600">
              <span
                aria-hidden="true"
                className={cn('h-2 w-2 rounded-full', row.dot)}
              />
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
