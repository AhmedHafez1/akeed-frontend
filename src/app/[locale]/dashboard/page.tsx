'use client'

import { useMemo, useState } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import type {
  VerificationStatus,
  VerificationStatusFilter,
} from '@/types/dashboard.model'

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
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
              Loading verifications...
            </div>
          ) : hasVerifications ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifications.map((verification) => (
                    <tr key={verification.id} className="text-slate-700">
                      <td className="px-4 py-3">
                        <StatusBadge status={verification.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {verification.customer_name || 'Unknown customer'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {verification.customer_phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {verification.order_number || 'Order'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {verification.order_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {verification.created_at
                          ? new Date(verification.created_at).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
              {emptyVerificationsMessage}
            </div>
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
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
              Loading orders...
            </div>
          ) : hasOrders ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Verification</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-slate-700">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {order.order_number || 'Order'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.external_order_id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {order.customer_name || 'Unknown customer'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.customer_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {order.total_price
                            ? `${order.total_price} ${order.currency ?? ''}`
                            : '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.customer_email || 'No email'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.verification_status ? (
                          <StatusBadge status={order.verification_status} />
                        ) : (
                          <span className="text-xs text-slate-500">
                            Not sent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
              No orders yet. Once orders are synced, they will show up here.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  const color =
    status === 'confirmed'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'pending' || status === 'sent'
        ? 'bg-amber-100 text-amber-700'
        : status === 'canceled' || status === 'failed'
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${color}`}
    >
      {status}
    </span>
  )
}
