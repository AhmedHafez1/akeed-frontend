import { useTranslations } from 'next-intl'
import { EmptyState, LoadingSpinner } from '@/shared/ui'
import { formatDashboardMoney } from '@/features/dashboard/lib/dashboardFormatters'
import type { DashboardStats } from '@/features/dashboard/model/dashboard.model'

interface StandaloneStatsSummaryProps {
  stats: DashboardStats | null
  isStatsLoading: boolean
}

function resolveRateColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (rate >= 55) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

function resolveUsageColor(percent: number): string {
  if (percent >= 95) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {t('metrics.cards.confirmed')}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {stats.totals.confirmed}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {t('metrics.cards.canceled')}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {stats.totals.canceled}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {t('metrics.cards.awaitingResponse')}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {Math.max(
              0,
              stats.totals.sent - stats.totals.confirmed - stats.totals.canceled
            )}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            <span title={t('tooltips.responseRate')}>
              {t('metrics.cards.responseRate')}
            </span>
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.totals.reply_rate}%
            </p>
            <span
              aria-hidden="true"
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${resolveRateColor(stats.totals.reply_rate)}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            <span title={t('tooltips.confirmationRate')}>
              {t('metrics.cards.confirmationRate')}
            </span>
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.totals.confirmation_rate}%
            </p>
            <span
              aria-hidden="true"
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${resolveRateColor(stats.totals.confirmation_rate)}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          </div>
        </div>
      </div>

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
