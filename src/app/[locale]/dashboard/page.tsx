'use client'

import { useMemo, useState } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { LoadingSpinner, EmptyState } from '@/components/ui'
import { VerificationsTable, OrdersTable } from '@/components/dashboard'
import type { VerificationStatusFilter } from '@/types/dashboard.model'

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'canceled', label: 'Canceled' },
] as const satisfies ReadonlyArray<{
  id: VerificationStatusFilter
  label: string
}>

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatusFilter>('all')
  const {
    verifications,
    orders,
    isVerificationsLoading,
    isOrdersLoading,
    error,
  } = useDashboardData(statusFilter)

  const hasVerifications = verifications.length > 0
  const hasOrders = orders.length > 0

  const emptyVerificationsMessage = useMemo(() => {
    if (statusFilter === 'all') {
      return 'No verifications yet. Once an order is received, verification requests will appear here.'
    }
    return 'No verifications match the selected status.'
  }, [statusFilter])

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Monitor verification status and recent orders across your channels.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
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
            <VerificationsTable verifications={verifications} />
          ) : (
            <EmptyState message={emptyVerificationsMessage} />
          )}
        </div>
      </section>

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
            <OrdersTable orders={orders} />
          ) : (
            <EmptyState message="No orders yet. Once orders are synced, they will show up here." />
          )}
        </div>
      </section>
    </div>
  )
}
