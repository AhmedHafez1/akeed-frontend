import { LoadingSpinner, EmptyState } from '@/shared/ui'
import { useTranslations } from 'next-intl'
import { VerificationsTableStandalone } from './VerificationsTableStandalone'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'

/**
 * Dashboard Standalone Skin
 *
 * Renders the full dashboard UI using Tailwind CSS and custom components.
 * Used in SaaS / standalone mode — NO Polaris imports allowed here.
 *
 * This component is purely presentational:
 *  - Receives all data and handlers via DashboardSkinProps
 *  - Contains zero business logic
 */
export function DashboardStandaloneSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  verifications,
  isVerificationsLoading,
  hasVerifications,
  emptyVerificationsMessage,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')

  const summaryStats = stats
    ? [
        {
          id: 'confirmed',
          label: t('metrics.cards.confirmed'),
          value: stats.totals.confirmed,
        },
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
        {
          id: 'canceled',
          label: t('metrics.cards.canceled'),
          value: stats.totals.canceled,
        },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-600">{t('subtitle')}</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>{t('filters.dateRange.label')}</span>
          <select
            value={dateRangeFilter}
            onChange={(event) =>
              onDateRangeFilterChange(
                event.target.value as DashboardStatsDateRange
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('metrics.summaryTitle')}
          </h2>
          {stats && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {t('metrics.replyRate', { value: stats.totals.reply_rate })}
            </span>
          )}
        </div>

        {isStatsLoading && !stats ? (
          <LoadingSpinner message={t('metrics.loading')} />
        ) : stats ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryStats.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs tracking-wide text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={t('metrics.unavailable')} />
        )}
      </section>

      {/* ── Verifications section ───────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {t('verificationSection.title')}
            </h2>
            <p className="text-sm text-slate-600">
              {t('verificationSection.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onStatusFilterChange(filter.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  statusFilter === filter.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {isVerificationsLoading ? (
            <LoadingSpinner message="Loading verifications..." />
          ) : hasVerifications ? (
            <VerificationsTableStandalone verifications={verifications} />
          ) : (
            <EmptyState message={emptyVerificationsMessage} />
          )}
        </div>
      </section>
    </div>
  )
}
