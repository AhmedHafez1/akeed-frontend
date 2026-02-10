import { LoadingSpinner, EmptyState } from '@/components/ui'
import { VerificationsTableStandalone } from './VerificationsTableStandalone'
import { OrdersTableStandalone } from './OrdersTableStandalone'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

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
  verifications,
  isVerificationsLoading,
  hasVerifications,
  emptyVerificationsMessage,
  orders,
  isOrdersLoading,
  hasOrders,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  error,
}: DashboardSkinProps) {
  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Monitor verification status and recent orders across your channels.
        </p>
      </header>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Verifications section ───────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Verification Status
            </h2>
            <p className="text-sm text-slate-600">
              Track pending, sent, confirmed, and canceled verification flows.
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

      {/* ── Orders section ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-600">
            Review the most recent orders synced into Akeed.
          </p>
        </div>

        <div className="mt-6">
          {isOrdersLoading ? (
            <LoadingSpinner message="Loading orders..." />
          ) : hasOrders ? (
            <OrdersTableStandalone orders={orders} />
          ) : (
            <EmptyState message="No orders yet. Once orders are synced, they will show up here." />
          )}
        </div>
      </section>
    </div>
  )
}
