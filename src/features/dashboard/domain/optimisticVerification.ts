import type { PendingManualOrder } from '@/features/orders'
import type {
  DashboardStats,
  VerificationItem,
  VerificationStatusFilter,
} from '../model/dashboard.model'
import { filterAdmitsStatus } from './verificationFilters'

/*
 * Optimistic rows are derived, never written into the query cache.
 *
 * The server's lists stay exactly what the server said; pending orders are
 * layered on top at read time. A failed submission therefore needs no
 * rollback, and a refetch can never wipe a row the worker has not written yet.
 */

export function toOptimisticVerification(
  order: PendingManualOrder
): VerificationItem {
  return {
    id: `optimistic:${order.idempotencyKey}`,
    optimistic: order.phase,
    status: 'pending',
    reason: null,
    order_id: order.orderId ?? '',
    order_number: order.payload.orderNumber,
    is_test: false,
    customer_name: order.payload.customerName,
    customer_phone: order.payload.customerPhone,
    total_price: order.payload.totalPrice,
    currency: order.payload.currency,
    created_at: new Date(order.submittedAt).toISOString(),
    last_sent_at: null,
    delivered_at: null,
    read_at: null,
    confirmed_at: null,
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    // No capabilities, so no row action is ever offered on a guess.
    capabilities: [],
  }
}

/**
 * Whether a view's data already counts this order.
 *
 * A view fetched at or after the moment the order was seen on the server
 * includes it; one fetched before does not, however recently. Each view checks
 * its own fetch time, so the list and the totals — which refetch in parallel
 * but land at different moments — each hand over in the render their own
 * fresh data arrives, and neither ever dips or double-counts.
 */
function isCountedBy(order: PendingManualOrder, viewUpdatedAt: number) {
  return order.seenAt !== null && viewUpdatedAt >= order.seenAt
}

/**
 * Server rows with pending orders prepended, when the filter would admit a
 * newly pending verification. An order the server already lists is never
 * shown twice.
 */
export function mergeOptimisticRows(
  rows: VerificationItem[],
  rowsUpdatedAt: number,
  pendingOrders: ReadonlyArray<PendingManualOrder>,
  statusFilter: VerificationStatusFilter
): VerificationItem[] {
  if (pendingOrders.length === 0) return rows
  if (!filterAdmitsStatus(statusFilter, 'pending')) return rows
  const listed = new Set(rows.map((row) => row.order_id))
  const optimistic = pendingOrders
    .filter(
      (order) =>
        !isCountedBy(order, rowsUpdatedAt) &&
        !(order.orderId && listed.has(order.orderId))
    )
    .map(toOptimisticVerification)
  return optimistic.length > 0 ? [...optimistic, ...rows] : rows
}

/** Totals counting pending orders as the pending verifications they will be. */
export function applyOptimisticTotals(
  stats: DashboardStats | null,
  statsUpdatedAt: number,
  pendingOrders: ReadonlyArray<PendingManualOrder>
): DashboardStats | null {
  if (!stats) return stats
  const count = pendingOrders.filter(
    (order) => !isCountedBy(order, statsUpdatedAt)
  ).length
  if (count === 0) return stats
  return {
    ...stats,
    totals: {
      ...stats.totals,
      total: stats.totals.total + count,
      in_progress: stats.totals.in_progress + count,
      pending: stats.totals.pending + count,
    },
  }
}
