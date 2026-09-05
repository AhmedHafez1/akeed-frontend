import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { EmptyState, LoadingSpinner } from '@/shared/ui'
import {
  formatDashboardMoney,
  formatDashboardNumber,
  formatDashboardPercent,
} from '@/features/dashboard/lib/dashboardFormatters'
import type { StandaloneDashboardStats } from '@/features/dashboard/model/dashboard.model'

interface StandaloneStatsSummaryProps {
  stats: StandaloneDashboardStats | null
  reportingTimezone: string
  isStatsLoading: boolean
}

function resolveUsageColor(percent: number): string {
  if (percent >= 95) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

type MetricTone = 'success' | 'critical' | 'caution'

interface MetricCard {
  id: string
  label: string
  value: string | number
  tone: MetricTone
  tooltip?: string
}

const metricAccentClassNames: Record<MetricTone, string> = {
  success: 'bg-emerald-600',
  critical: 'bg-red-700',
  caution: 'bg-amber-500',
}

function StandaloneMetricCard({ label, value, tone, tooltip }: MetricCard) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${metricAccentClassNames[tone]}`}
        />
        <p className="min-w-0 truncate text-xs font-medium tracking-wide text-slate-500 uppercase">
          {label}
        </p>
        {tooltip ? (
          <span
            title={tooltip}
            aria-label={tooltip}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
          >
            i
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  )
}

export function StandaloneStatsSummary({
  stats,
  reportingTimezone,
  isStatsLoading,
}: StandaloneStatsSummaryProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const usagePercent = stats
    ? Math.min(
        100,
        Math.round((stats.usage.used / Math.max(stats.usage.limit, 1)) * 100)
      )
    : 0

  if (isStatsLoading && !stats) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <LoadingSpinner message={t('metrics.loading')} />
      </section>
    )
  }

  if (!stats) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState message={t('metrics.unavailable')} />
      </section>
    )
  }

  const orderOutcomeMetrics: MetricCard[] = [
    {
      id: 'total',
      label: t('orders.metrics.total'),
      value: formatDashboardNumber(stats.order_totals.total, locale),
      tone: 'success',
    },
    {
      id: 'inProgress',
      label: t('orders.metrics.inProgress'),
      value: formatDashboardNumber(stats.order_totals.in_progress, locale),
      tone: 'caution',
    },
    {
      id: 'needsAttention',
      label: t('orders.metrics.needsAttention'),
      value: formatDashboardNumber(stats.order_totals.needs_attention, locale),
      tone: 'critical',
    },
    {
      id: 'confirmed',
      label: t('orders.metrics.confirmed'),
      value: formatDashboardNumber(stats.order_totals.confirmed, locale),
      tone: 'success',
    },
    {
      id: 'canceled',
      label: t('orders.metrics.canceled'),
      value: formatDashboardNumber(stats.order_totals.canceled, locale),
      tone: 'critical',
    },
  ]

  const needsAttentionMetrics: MetricCard[] = [
    {
      id: 'responseRate',
      label: t('metrics.cards.responseRate'),
      value: formatDashboardPercent(
        stats.verification_totals.reply_rate,
        locale
      ),
      tone:
        stats.verification_totals.reply_rate >= 80
          ? 'success'
          : stats.verification_totals.reply_rate >= 55
            ? 'caution'
            : 'critical',
      tooltip: t('tooltips.responseRate'),
    },
    {
      id: 'confirmationRate',
      label: t('metrics.cards.confirmationRate'),
      value: formatDashboardPercent(
        stats.verification_totals.confirmation_rate,
        locale
      ),
      tone:
        stats.verification_totals.confirmation_rate >= 70
          ? 'success'
          : stats.verification_totals.confirmation_rate >= 45
            ? 'caution'
            : 'critical',
      tooltip: t('tooltips.confirmationRate'),
    },
    {
      id: 'failed',
      label: t('metrics.cards.failed'),
      value: formatDashboardNumber(stats.verification_totals.failed, locale),
      tone: 'critical',
      tooltip: t('tooltips.failed'),
    },
    {
      id: 'followUps',
      label: t('metrics.cards.followUps'),
      value: formatDashboardNumber(
        stats.verification_totals.follow_ups_sent,
        locale
      ),
      tone: 'caution',
      tooltip: t('tooltips.followUps'),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          {t('metrics.sections.orderOutcomes')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {orderOutcomeMetrics.map((metric) => (
            <StandaloneMetricCard key={metric.id} {...metric} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          {t('metrics.sections.verificationSummary')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {needsAttentionMetrics.map((metric) => (
            <StandaloneMetricCard key={metric.id} {...metric} />
          ))}
        </div>
      </section>

      {usagePercent >= 80 && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            usagePercent >= 95
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {usagePercent >= 95
            ? t('metrics.usage.warningAtLimit')
            : t('metrics.usage.warningNearLimit')}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {t('metrics.usage.title')}
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {formatDashboardNumber(stats.usage.used, locale)}
          <span className="text-lg font-normal text-slate-400">
            {' '}
            / {formatDashboardNumber(stats.usage.limit, locale)}
          </span>
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${resolveUsageColor(usagePercent)}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {stats.usage.period_start && stats.usage.period_end ? (
          <p className="mt-3 text-xs text-slate-500">
            {t('metrics.usage.period', {
              start: new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
                timeZone: reportingTimezone,
              }).format(new Date(stats.usage.period_start)),
              end: new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
                timeZone: reportingTimezone,
              }).format(new Date(stats.usage.period_end)),
            })}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            {t('metrics.summaryTitle')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                id: 'sent',
                label: t('metrics.cards.sent'),
                value: formatDashboardNumber(
                  stats.verification_totals.sent,
                  locale
                ),
              },
              {
                id: 'delivered',
                label: t('metrics.cards.delivered'),
                value: formatDashboardNumber(
                  stats.verification_totals.delivered,
                  locale
                ),
              },
              {
                id: 'read',
                label: t('metrics.cards.read'),
                value: formatDashboardNumber(
                  stats.verification_totals.read,
                  locale
                ),
              },
            ].map((metric) => (
              <div
                key={metric.id}
                className="rounded-xl bg-slate-50 p-3 text-center"
              >
                <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">
            {t('metrics.moneySaved.title')}
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            {t('metrics.moneySaved.description')}
          </p>
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatDashboardMoney(
              stats.savings.money_saved,
              stats.savings.currency,
              locale
            )}
          </p>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] text-slate-400">
              {t('metrics.moneySaved.breakdownTitle')}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('metrics.moneySaved.breakdownLine', {
                count: formatDashboardNumber(
                  stats.verification_totals.canceled,
                  locale
                ),
                cost: formatDashboardMoney(
                  stats.savings.avg_shipping_cost,
                  stats.savings.currency,
                  locale
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
