import { useTranslations } from 'next-intl'
import { EmptyState, LoadingSpinner } from '@/shared/ui'
import { formatDashboardMoney } from '@/features/dashboard/lib/dashboardFormatters'
import type { DashboardStats } from '@/features/dashboard/model/dashboard.model'

interface StandaloneStatsSummaryProps {
  stats: DashboardStats | null
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
  isStatsLoading,
}: StandaloneStatsSummaryProps) {
  const t = useTranslations('dashboard')
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
      id: 'confirmed',
      label: t('metrics.cards.confirmedOrders'),
      value: stats.totals.confirmed,
      tone: 'success',
      tooltip: t('tooltips.confirmedOrders'),
    },
    {
      id: 'customerCanceled',
      label: t('metrics.cards.customerCanceled'),
      value: stats.totals.customer_canceled,
      tone: 'critical',
      tooltip: t('tooltips.customerCanceled'),
    },
    {
      id: 'awaitingResponse',
      label: t('metrics.cards.awaitingResponse'),
      value: stats.totals.awaiting_reply,
      tone: 'caution',
      tooltip: t('tooltips.awaitingReply'),
    },
    {
      id: 'pending',
      label: t('metrics.cards.pending'),
      value: stats.totals.pending,
      tone: 'caution',
      tooltip: t('tooltips.pending'),
    },
  ]

  const needsAttentionMetrics: MetricCard[] = [
    {
      id: 'responseRate',
      label: t('metrics.cards.responseRate'),
      value: `${stats.totals.reply_rate}%`,
      tone:
        stats.totals.reply_rate >= 80
          ? 'success'
          : stats.totals.reply_rate >= 55
            ? 'caution'
            : 'critical',
      tooltip: t('tooltips.responseRate'),
    },
    {
      id: 'confirmationRate',
      label: t('metrics.cards.confirmationRate'),
      value: `${stats.totals.confirmation_rate}%`,
      tone:
        stats.totals.confirmation_rate >= 70
          ? 'success'
          : stats.totals.confirmation_rate >= 45
            ? 'caution'
            : 'critical',
      tooltip: t('tooltips.confirmationRate'),
    },
    {
      id: 'failed',
      label: t('metrics.cards.failed'),
      value: stats.totals.failed,
      tone: 'critical',
      tooltip: t('tooltips.failed'),
    },
    {
      id: 'followUps',
      label: t('metrics.cards.followUps'),
      value: stats.totals.follow_ups_sent,
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {orderOutcomeMetrics.map((metric) => (
            <StandaloneMetricCard key={metric.id} {...metric} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          {t('metrics.sections.needsAttention')}
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
          {stats.usage.used}
          <span className="text-lg font-normal text-slate-400">
            {' '}
            / {stats.usage.limit}
          </span>
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${resolveUsageColor(usagePercent)}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
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
                value: stats.totals.sent,
              },
              {
                id: 'delivered',
                label: t('metrics.cards.delivered'),
                value: stats.totals.delivered,
              },
              {
                id: 'read',
                label: t('metrics.cards.read'),
                value: stats.totals.read,
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
              stats.savings.currency
            )}
          </p>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] text-slate-400">
              {t('metrics.moneySaved.breakdownTitle')}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('metrics.moneySaved.breakdownLine', {
                count: stats.totals.canceled,
                cost: stats.savings.avg_shipping_cost,
                currency: stats.savings.currency,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
