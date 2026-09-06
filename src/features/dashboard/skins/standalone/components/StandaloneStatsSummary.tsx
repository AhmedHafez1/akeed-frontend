'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Package,
  TriangleAlert,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui'
import {
  formatDashboardNumber,
  formatDashboardPercent,
} from '@/features/dashboard/lib/dashboardFormatters'
import type {
  OrderItem,
  StandaloneDashboardStats,
} from '@/features/dashboard/model/dashboard.model'

interface StandaloneStatsSummaryProps {
  stats: StandaloneDashboardStats | null
  reportingTimezone: string
  isStatsLoading: boolean
  orders: OrderItem[]
  isOrdersLoading: boolean
  ordersError: string | null
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <DashboardCard key={index} className="p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <DashboardCard className="h-72 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-8 h-12 w-32" />
          <Skeleton className="mt-8 h-3 w-full" />
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </DashboardCard>
        <DashboardCard className="h-72 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-10 h-10 w-44" />
          <Skeleton className="mt-6 h-3 w-full" />
          <Skeleton className="mt-5 h-4 w-40" />
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

function formatUsagePeriod(
  start: string | null,
  end: string | null,
  locale: string,
  reportingTimezone: string
): { start: string; end: string } | null {
  if (!start || !end) return null
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: reportingTimezone,
  })
  return { start: formatter.format(startDate), end: formatter.format(endDate) }
}

const attentionStatusClasses: Record<string, string> = {
  failed: 'border-red-200 bg-red-50 text-red-700',
  blocked: 'border-amber-200 bg-amber-50 text-amber-800',
  no_reply: 'border-amber-200 bg-amber-50 text-amber-800',
  expired: 'border-amber-200 bg-amber-50 text-amber-800',
  review_required: 'border-amber-200 bg-amber-50 text-amber-800',
  ineligible: 'border-stone-200 bg-stone-50 text-slate-700',
}

export function StandaloneStatsSummary({
  stats,
  reportingTimezone,
  isStatsLoading,
  orders,
  isOrdersLoading,
  ordersError,
}: StandaloneStatsSummaryProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()

  if (isStatsLoading && !stats) return <DashboardSkeleton />

  const attentionOrders = orders.slice(0, 3)

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
          orders={attentionOrders}
          isLoading={isOrdersLoading}
          error={ordersError}
          reportingTimezone={reportingTimezone}
        />
      </div>
    )
  }

  const metrics = [
    {
      id: 'total',
      label: t('orders.metrics.total'),
      value: formatDashboardNumber(stats.order_totals.total, locale),
      icon: Package,
      iconClassName: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'confirmed',
      label: t('orders.metrics.confirmed'),
      value: formatDashboardNumber(stats.order_totals.confirmed, locale),
      icon: CheckCircle2,
      iconClassName: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'attention',
      label: t('orders.metrics.needsAttention'),
      value: formatDashboardNumber(stats.order_totals.needs_attention, locale),
      icon: TriangleAlert,
      iconClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'rate',
      label: t('metrics.cards.confirmationRate'),
      value: formatDashboardPercent(
        stats.verification_totals.confirmation_rate,
        locale
      ),
      icon: CircleGauge,
      iconClassName: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
  ]

  return (
    <div className="space-y-5">
      <section
        aria-label={t('standalone.kpisLabel')}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <DashboardCard key={metric.id} className="p-5">
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                    metric.iconClassName
                  )}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-600">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    {metric.value}
                  </p>
                </div>
              </div>
            </DashboardCard>
          )
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <PerformanceSummary stats={stats} />
        <UsageSummary stats={stats} reportingTimezone={reportingTimezone} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AttentionPreview
          orders={attentionOrders}
          isLoading={isOrdersLoading}
          error={ordersError}
          reportingTimezone={reportingTimezone}
        />
        <OutcomeBreakdown stats={stats} />
      </div>
    </div>
  )
}

function PerformanceSummary({ stats }: { stats: StandaloneDashboardStats }) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const confirmationRate = Math.min(
    100,
    Math.max(0, stats.verification_totals.confirmation_rate)
  )
  const periodLabel = t(`filters.dateRange.${stats.date_range}`)
  const detailMetrics = [
    {
      id: 'sent',
      label: t('metrics.cards.sent'),
      value: stats.verification_totals.sent,
    },
    {
      id: 'delivered',
      label: t('metrics.cards.delivered'),
      value: stats.verification_totals.delivered,
    },
    {
      id: 'read',
      label: t('metrics.cards.read'),
      value: stats.verification_totals.read,
    },
  ]

  return (
    <DashboardCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">
            {t('standalone.performance.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('standalone.performance.period', { period: periodLabel })}
          </p>
        </div>
        <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {periodLabel}
        </span>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {t('standalone.performance.confirmationRate')}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-700">
            {formatDashboardPercent(confirmationRate, locale)}
          </p>
        </div>
        <p className="max-w-sm text-sm leading-6 text-slate-500">
          {t('standalone.performance.description')}
        </p>
      </div>

      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-100"
        role="progressbar"
        aria-label={t('standalone.performance.confirmationRate')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={confirmationRate}
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
          style={{ width: `${confirmationRate}%` }}
        />
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {detailMetrics.map((metric) => (
          <div key={metric.id} className="rounded-xl bg-stone-50 p-3 sm:p-4">
            <dt className="text-xs font-medium text-slate-500">
              {metric.label}
            </dt>
            <dd className="mt-1 text-xl font-bold text-slate-950">
              {formatDashboardNumber(metric.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </DashboardCard>
  )
}

function UsageSummary({
  stats,
  reportingTimezone,
}: {
  stats: StandaloneDashboardStats
  reportingTimezone: string
}) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const used = Number.isFinite(stats.usage.used)
    ? Math.max(0, stats.usage.used)
    : 0
  const limit = stats.usage.limit
  const isUnlimited = Number.isFinite(limit) && limit < 0
  const hasLimit = Number.isFinite(limit) && limit > 0
  const usagePercent = hasLimit
    ? Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
    : null
  const remaining = hasLimit ? Math.max(0, limit - used) : null
  const isExhausted = hasLimit && remaining === 0
  const usagePeriod = formatUsagePeriod(
    stats.usage.period_start,
    stats.usage.period_end,
    locale,
    reportingTimezone
  )
  const usageColor = isExhausted
    ? 'bg-red-600'
    : (usagePercent ?? 0) >= 80
      ? 'bg-amber-500'
      : 'bg-emerald-600'

  return (
    <DashboardCard className="flex flex-col p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-950">
        {t('standalone.usage.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {t('standalone.usage.description')}
      </p>

      <div className="mt-7">
        <p className="text-3xl font-bold tracking-tight text-slate-950">
          {formatDashboardNumber(used, locale)}
          <span className="text-lg font-medium text-slate-400">
            {hasLimit
              ? ` / ${formatDashboardNumber(limit, locale)}`
              : isUnlimited
                ? ` / ${t('standalone.usage.unlimited')}`
                : ''}
          </span>
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {t('standalone.usage.usedLabel')}
        </p>
      </div>

      {hasLimit && usagePercent !== null ? (
        <>
          <div
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-label={t('standalone.usage.percentUsed', {
              value: usagePercent,
            })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usagePercent}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                usageColor
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
            <span
              className={cn(
                'font-semibold',
                isExhausted ? 'text-red-700' : 'text-slate-700'
              )}
            >
              {t('standalone.usage.percentUsed', { value: usagePercent })}
            </span>
            <span className="text-slate-500">
              {t(
                isExhausted
                  ? 'standalone.usage.exhausted'
                  : 'standalone.usage.remaining',
                { value: formatDashboardNumber(remaining ?? 0, locale) }
              )}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-stone-50 p-3 text-sm text-slate-600">
          {t(
            isUnlimited
              ? 'standalone.usage.unlimitedDescription'
              : 'standalone.usage.unavailable'
          )}
        </p>
      )}

      {usagePeriod ? (
        <p className="mt-4 text-xs text-slate-500">
          {t('metrics.usage.period', {
            start: usagePeriod.start,
            end: usagePeriod.end,
          })}
        </p>
      ) : null}

      <Link
        href={`${withLocale('/settings', locale)}#subscription-usage`}
        className="mt-auto inline-flex w-fit items-center gap-2 rounded-lg pt-5 text-sm font-semibold text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {t('standalone.usage.manage')}
        <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </DashboardCard>
  )
}

function AttentionPreview({
  orders,
  isLoading,
  error,
  reportingTimezone,
}: {
  orders: OrderItem[]
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
        ) : orders.length === 0 ? (
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
            {orders.map((order) => (
              <li
                key={order.id}
                className="grid gap-2 py-4 sm:grid-cols-[minmax(90px,0.65fr)_minmax(120px,1fr)_auto] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {order.order_number
                      ? `#${order.order_number}`
                      : t('orders.referenceFallback')}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                    {formatOrderDate(
                      order.created_at,
                      locale,
                      reportingTimezone,
                      t('standalone.attention.dateUnavailable')
                    )}
                  </p>
                </div>
                <p className="truncate text-sm text-slate-700">
                  {order.customer_name || t('orders.unknownCustomer')}
                </p>
                <span
                  className={cn(
                    'w-fit rounded-lg border px-2.5 py-1 text-xs font-semibold',
                    attentionStatusClasses[order.lifecycle.status] ??
                      attentionStatusClasses.review_required
                  )}
                >
                  {t(`orders.status.${order.lifecycle.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardCard>
  )
}

function OutcomeBreakdown({ stats }: { stats: StandaloneDashboardStats }) {
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
      label: t('orders.metrics.confirmed'),
      value: stats.order_totals.confirmed,
      color: 'bg-emerald-600',
    },
    {
      id: 'canceled',
      label: t('orders.metrics.canceled'),
      value: stats.order_totals.canceled,
      color: 'bg-red-500',
    },
    {
      id: 'inProgress',
      label: t('orders.metrics.inProgress'),
      value: stats.order_totals.in_progress,
      color: 'bg-slate-400',
    },
    {
      id: 'needsAttention',
      label: t('orders.metrics.needsAttention'),
      value: stats.order_totals.needs_attention,
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
