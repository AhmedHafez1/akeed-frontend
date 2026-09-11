import type {
  DashboardStats,
  DashboardStatsDateRange,
  VerificationItem,
  VerificationStatus,
} from '@/features/dashboard/model/dashboard.model'
import type { CreditSummary } from '@/features/billing/domain/billing.types'
import type { ManualOrderCreateInput } from '@/features/orders/api/manualOrderApi'
import { ApiError } from '@/shared/lib/http'

/*
 * An in-memory backend with the properties the real one has and the other
 * fixtures lack. `POST /api/orders` answers 202 before the verification exists.
 * A simulated worker writes it after a chosen delay, holding a credit, and the
 * simulated WhatsApp send then posts that credit and moves the row to `sent`.
 * Stats answer slower than the list, as the real aggregate query does, so the
 * two views refresh in parallel but land at different moments.
 */

type WorkerSpeed = 'fast' | 'slow' | 'never'
type OrderResult = 'success' | 'duplicate' | 'failure'

const WORKER_DELAY_MS: Record<WorkerSpeed, number> = {
  fast: 1500,
  slow: 8000,
  never: Number.POSITIVE_INFINITY,
}
/** From the verification being written to WhatsApp accepting the send. */
const DISPATCH_DELAY_MS = 2500
const ACCEPT_LATENCY_MS = 700
const READ_LATENCY_MS = 150
const STATS_LATENCY_MS = 650

interface QueuedVerification {
  materializesAt: number
  row: VerificationItem
}

interface OrderSyncState {
  rows: VerificationItem[]
  queued: QueuedVerification[]
  dispatching: Array<{ dispatchesAt: number; row: VerificationItem }>
  posted: number
  held: number
  sequence: number
  requests: string[]
}

type OrderSyncHost = typeof globalThis & {
  __akeedOrderSyncFixture?: OrderSyncState
}

function baseRow(
  id: string,
  status: VerificationStatus,
  customer: string,
  createdAt: string
): VerificationItem {
  return {
    id: `order-sync-verification-${id}`,
    status,
    reason: null,
    order_id: `order-sync-order-${id}`,
    order_number: `SYNC-${id}`,
    is_test: false,
    customer_name: customer,
    customer_phone: '+201000000100',
    total_price: '500.00',
    currency: 'EGP',
    created_at: createdAt,
    last_sent_at: createdAt,
    delivered_at: createdAt,
    read_at: null,
    confirmed_at: status === 'confirmed' ? createdAt : null,
    canceled_at: status === 'canceled' ? createdAt : null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    capabilities: [],
  }
}

function getState(): OrderSyncState {
  const host = globalThis as OrderSyncHost
  host.__akeedOrderSyncFixture ??= {
    rows: [
      baseRow('2', 'canceled', 'Synthetic canceled', '2026-09-11T09:00:00Z'),
      baseRow('1', 'confirmed', 'Synthetic confirmed', '2026-09-11T08:00:00Z'),
    ],
    queued: [],
    dispatching: [],
    posted: 20,
    held: 0,
    sequence: 100,
    requests: [],
  }
  return host.__akeedOrderSyncFixture
}

function selected<T extends string>(id: string, fallback: T): T {
  if (typeof document === 'undefined') return fallback
  const value = (document.getElementById(id) as HTMLSelectElement | null)?.value
  return (value || fallback) as T
}

/**
 * The simulated worker and provider, run lazily on every read: write each
 * verification whose delay has passed (holding a credit), then send each one
 * whose dispatch delay has passed (posting the held credit).
 */
function runWorker(state: OrderSyncState) {
  const now = Date.now()
  const due = state.queued.filter((item) => item.materializesAt <= now)
  state.queued = state.queued.filter((item) => item.materializesAt > now)
  for (const item of due) {
    state.rows.unshift(item.row)
    state.held += 1
    state.dispatching.push({
      dispatchesAt: item.materializesAt + DISPATCH_DELAY_MS,
      row: item.row,
    })
  }
  const sent = state.dispatching.filter((item) => item.dispatchesAt <= now)
  state.dispatching = state.dispatching.filter(
    (item) => item.dispatchesAt > now
  )
  for (const item of sent) {
    item.row.status = 'sent'
    item.row.last_sent_at = new Date(item.dispatchesAt).toISOString()
    state.held -= 1
    state.posted -= 1
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isOrderSyncFixture() {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.endsWith('/order-sync')
  )
}

export function orderSyncSnapshot() {
  const state = getState()
  runWorker(state)
  return {
    listed: state.rows.map((row) => row.order_number),
    queued: state.queued.map((item) => item.row.order_number),
    posted: state.posted,
    held: state.held,
    requests: [...state.requests],
  }
}

export function resetOrderSyncFixture() {
  delete (globalThis as OrderSyncHost).__akeedOrderSyncFixture
}

function stats(
  rows: VerificationItem[],
  dateRange: DashboardStatsDateRange
): DashboardStats {
  const count = (...matching: VerificationStatus[]) =>
    rows.filter((row) => matching.includes(row.status)).length
  return {
    date_range: dateRange,
    reporting_timezone: 'Africa/Cairo',
    source: {
      status: 'connected',
      integration_id: 'order-sync',
      platform_type: 'standalone',
    },
    automation: {
      is_auto_verify_enabled: true,
      follow_up_enabled: false,
      quiet_hours_enabled: false,
    },
    totals: {
      total: rows.length,
      in_progress: count('pending', 'sent', 'delivered', 'read'),
      needs_attention: count('failed', 'expired', 'no_reply'),
      pending: count('pending'),
      failed: count('failed'),
      awaiting_reply: count('sent', 'delivered', 'read', 'no_reply'),
      confirmed: count('confirmed'),
      canceled: count('canceled'),
      customer_canceled: count('canceled'),
      sent: count('sent'),
      delivered: count('delivered'),
      read: count('read'),
      follow_ups_sent: 0,
      reply_rate: 0,
      confirmation_rate: 0,
    },
    usage: {
      used: rows.length,
      limit: 100,
      period_start: null,
      period_end: null,
    },
    savings: { avg_shipping_cost: 50, currency: 'EGP', money_saved: 0 },
  }
}

export async function orderSyncRequest<T>(
  method: 'GET' | 'POST',
  url: string,
  data?: unknown
): Promise<T> {
  const state = getState()
  state.requests.push(`${method} ${url}`)
  const query = new URL(url, 'http://fixture.local')

  if (method === 'POST' && query.pathname === '/api/orders') {
    await delay(ACCEPT_LATENCY_MS)
    const result = selected<OrderResult>('order-sync-result', 'success')
    if (result === 'failure') {
      throw new ApiError(
        'The order could not be durably accepted. Retry safely.',
        503,
        'MANUAL_ORDER_ACCEPTANCE_FAILED'
      )
    }
    if (result === 'duplicate') {
      return {
        orderId: state.rows[0]?.order_id ?? 'order-sync-order-1',
        status: 'accepted',
        duplicate: true,
      } as T
    }
    const input = data as ManualOrderCreateInput
    const id = String(++state.sequence)
    const row: VerificationItem = {
      ...baseRow(id, 'pending', input.customerName, new Date().toISOString()),
      order_number: input.orderNumber,
      customer_phone: input.customerPhone,
      total_price: input.totalPrice,
      currency: input.currency,
      last_sent_at: null,
      delivered_at: null,
    }
    const speed = selected<WorkerSpeed>('order-sync-worker', 'fast')
    state.queued.push({
      materializesAt: Date.now() + WORKER_DELAY_MS[speed],
      row,
    })
    // Like the real service: 202 once queued, no verification id yet.
    return { orderId: row.order_id, status: 'accepted', duplicate: false } as T
  }

  await delay(
    query.pathname === '/api/verifications/stats'
      ? STATS_LATENCY_MS
      : READ_LATENCY_MS
  )
  runWorker(state)

  if (method === 'GET' && query.pathname === '/api/verifications/stats') {
    const dateRange = (query.searchParams.get('date_range') ??
      'last_30_days') as DashboardStatsDateRange
    return { stats: stats(state.rows, dateRange) } as T
  }

  if (method === 'GET' && query.pathname === '/api/verifications') {
    const statuses = query.searchParams.get('status')?.split(',')
    const limit = Number(query.searchParams.get('limit') ?? 50)
    const matching = state.rows.filter(
      (row) => !statuses || statuses.includes(row.status)
    )
    return {
      data: matching.slice(0, limit),
      next_cursor: null,
      total_count: matching.length,
      page_context: {
        source: {
          status: 'connected',
          integration_id: 'order-sync',
          platform_type: 'standalone',
        },
        reporting_timezone: 'Africa/Cairo',
        automation: {
          is_auto_verify_enabled: true,
          follow_up_enabled: false,
          quiet_hours_enabled: false,
        },
        permissions: {
          can_send_test_verification: false,
          can_cancel_orders: false,
          can_create_manual_order: true,
          can_retry_verifications: false,
        },
        usage: {
          used: state.rows.length,
          limit: 0,
          remaining: state.posted - state.held,
          period_end: null,
          credit_denial:
            state.posted - state.held > 0 ? null : 'INSUFFICIENT_CREDITS',
        },
      },
    } as T
  }

  throw new Error(`Unexpected order-sync fixture ${method}: ${url}`)
}

export async function orderSyncCreditsResponse(): Promise<Response> {
  const state = getState()
  state.requests.push('GET /api/billing/credits')
  await delay(READ_LATENCY_MS)
  runWorker(state)
  const summary: CreditSummary = {
    billingEnabled: true,
    status: 'active',
    postedBalance: state.posted,
    heldCredits: state.held,
    availableCredits: Math.max(state.posted - state.held, 0),
    debtCredits: Math.max(-state.posted, 0),
    lowBalanceThreshold: 5,
    freeGrant: { granted: true, quantity: 20, grantedAt: null },
    price: { unitPriceMinor: 200, currency: 'EGP' },
    range: { min: 100, max: 5000, step: 50 },
    canPurchase: true,
    purchaseDenialReason: null,
  }
  return Response.json(summary)
}
