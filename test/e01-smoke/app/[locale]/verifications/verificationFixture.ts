import type {
  DashboardStats,
  DashboardStatsDateRange,
  LifecycleStatus,
  VerificationItem,
  VerificationStatus,
  VerificationsResponse,
} from '@/features/dashboard/model/dashboard.model'
import { isImportReplay, replayVerifications } from '../imports/importReplay'

const timestamp = '2026-09-06T07:42:00Z'
const statuses: VerificationStatus[] = [
  'no_reply',
  'confirmed',
  'read',
  'failed',
  'canceled',
  'pending',
  'sent',
  'delivered',
  'expired',
  'no_reply',
  'failed',
]
let rows: VerificationItem[] = statuses.map((status, index) => ({
  id: `triage-${index}`,
  order_id: `triage-order-${index}`,
  order_number: `${1048 - index}`,
  customer_name: [
    'Sara Al Harbi',
    'Omar Al Mansoori',
    'Fatima Al Zaabi',
    'Ahmed Hafez',
    'محمد علي',
    'Abdelghany Hafez',
  ][index % 6],
  customer_phone: '+201148675077',
  total_price: `${750 + index * 100}.00`,
  currency: 'EGP',
  status,
  reason: status === 'failed' ? 'provider_not_accepted' : null,
  is_test: index === 5,
  capabilities:
    index === 9
      ? undefined
      : index === 0
        ? [{ action: 'merchant_no_reply_cancellation', supported: true }]
        : index === 3
          ? [{ action: 'retry_verification', supported: true }]
          : [],
  created_at: timestamp,
  last_sent_at: ['failed', 'pending'].includes(status) ? null : timestamp,
  // Confirmation completes the rail even when delivery timestamps are absent.
  delivered_at: ['read', 'delivered'].includes(status) ? timestamp : null,
  read_at: status === 'read' ? timestamp : null,
  confirmed_at: status === 'confirmed' ? timestamp : null,
  canceled_at: status === 'canceled' ? timestamp : null,
  expired_at: status === 'expired' ? timestamp : null,
  no_reply_at: status === 'no_reply' ? timestamp : null,
  follow_up_sent_at: index === 2 ? timestamp : null,
  follow_up_attempts: index === 2 ? 1 : 0,
}))

/*
 * The eleven rows above carry the scenarios (cancel, retry, every status);
 * these exist only so the list is longer than one page at the size the app
 * actually asks for, which is what makes scroll-loading observable here.
 */
rows = rows.concat(
  Array.from({ length: 34 }, (_, index) => ({
    ...rows[index % rows.length],
    id: `triage-filler-${index}`,
    order_id: `triage-filler-order-${index}`,
    order_number: `${900 - index}`,
    capabilities: [],
  }))
)

/*
 * US-04.6-08: the orders of an import, as `?importBatchId=` filters them.
 * The M9 mix of held and confirmed outcomes, rendered by the same table as
 * every other order. `b-none`, and any id the import fixture does not know,
 * has no visible order, which is the existing empty state.
 */
const IMPORT_BATCH_IDS = new Set([
  'b-imported',
  'b-releasing',
  'b-paused',
  'b-stopped',
  'b-completed',
])
const importStatuses: LifecycleStatus[] = [
  'awaiting_start',
  'confirmed',
  'no_reply',
  'confirmed',
  'canceled',
  'awaiting_start',
  'confirmed',
  'no_reply',
]
const importRows: VerificationItem[] = importStatuses.map((status, index) => ({
  ...rows[index],
  id: `import-${index}`,
  order_id: `import-order-${index}`,
  order_number: `IMP-K7Q2XM-${index + 2}`,
  status,
  reason: null,
  is_test: false,
  capabilities: [],
  last_sent_at: status === 'awaiting_start' ? null : timestamp,
  delivered_at: null,
  read_at: null,
  confirmed_at: status === 'confirmed' ? timestamp : null,
  canceled_at: status === 'canceled' ? timestamp : null,
  expired_at: null,
  no_reply_at: status === 'no_reply' ? timestamp : null,
}))

export const verificationRequests: string[] = []
export function isVerificationFixture() {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.endsWith('/verifications')
  )
}

export async function verificationFixtureRequest<T>(
  method: 'GET' | 'POST',
  url: string
): Promise<T> {
  verificationRequests.push(`${method} ${url}`)
  const scenario = new URLSearchParams(window.location.search).get('scenario')
  const query = new URL(url, window.location.origin)
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      scenario === 'loading'
        ? 15000
        : query.searchParams.has('cursor') && scenario === 'slow-cursor'
          ? 2500
          : 250
    )
  )
  const canWrite = scenario !== 'readonly'
  const source = {
    status: scenario === 'disconnected' ? 'disconnected' : 'connected',
    integration_id: 'synthetic',
    platform_type: 'standalone',
  } as const
  const automation = {
    is_auto_verify_enabled: true,
    follow_up_enabled: true,
    quiet_hours_enabled: false,
  }
  const importBatchId = query.searchParams.get('importBatchId')
  // US-04.6-10: the batch the release-gate replay imported, as the backend
  // listed it.
  const replayed = isImportReplay()
    ? (replayVerifications(url) as { data: VerificationItem[] } | undefined)
    : undefined
  const dataset =
    scenario === 'empty'
      ? []
      : replayed
        ? replayed.data
        : importBatchId
          ? IMPORT_BATCH_IDS.has(importBatchId)
            ? importRows
            : []
          : rows
  if (method === 'GET' && query.pathname === '/api/verifications/stats') {
    if (scenario === 'stats-error') throw new Error('Synthetic metrics failure')
    const count = (...matching: LifecycleStatus[]) =>
      dataset.filter((row) => matching.includes(row.status)).length
    const stats: DashboardStats = {
      date_range: query.searchParams.get(
        'date_range'
      ) as DashboardStatsDateRange,
      reporting_timezone: 'Africa/Cairo',
      source,
      automation,
      totals: {
        total: dataset.length,
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
        follow_ups_sent: 1,
        reply_rate: 0,
        confirmation_rate: 0,
      },
      usage: {
        used: dataset.length,
        limit: 100,
        period_start: null,
        period_end: null,
      },
      savings: { avg_shipping_cost: 50, currency: 'EGP', money_saved: 0 },
    }
    return { stats } as T
  }
  if (method === 'GET' && query.pathname === '/api/verifications') {
    if (scenario === 'cursor-error' && query.searchParams.has('cursor'))
      throw new Error('Synthetic cursor failure')
    const matching = query.searchParams.get('status')?.split(',')
    const filtered = dataset.filter(
      (row) => !matching || matching.includes(row.status)
    )
    const offset = Number(query.searchParams.get('cursor') ?? '0')
    // Honour the page size the client asks for, so the fixture reports what
    // the real endpoint would rather than a size of its own choosing.
    const limit = Number(query.searchParams.get('limit') ?? '6')
    const response: VerificationsResponse = {
      data: filtered.slice(offset, offset + limit),
      total_count: filtered.length,
      next_cursor:
        offset + limit < filtered.length ? String(offset + limit) : null,
      page_context: {
        source,
        automation,
        reporting_timezone: 'Africa/Cairo',
        permissions: {
          can_send_test_verification: canWrite,
          can_cancel_orders: canWrite,
          can_retry_verifications: canWrite,
          can_create_manual_order: canWrite,
        },
      },
    }
    return response as T
  }
  if (method === 'POST') {
    if (scenario === 'action-error') throw new Error('Synthetic action failure')
    if (url === '/api/verifications/triage-0/cancel') {
      rows = rows.map((row) =>
        row.id === 'triage-0'
          ? {
              ...row,
              status: 'canceled',
              canceled_at: timestamp,
              capabilities: [],
            }
          : row
      )
      return {
        success: true,
        status: 'canceled',
        verificationId: 'triage-0',
        operation: { status: 'applied' },
      } as T
    }
    if (url === '/api/orders/triage-order-3/verification/retry') {
      rows = rows.map((row) =>
        row.id === 'triage-3'
          ? { ...row, status: 'pending', reason: null, capabilities: [] }
          : row
      )
      return {
        orderId: 'triage-order-3',
        lifecycle: { status: 'pending' },
      } as T
    }
  }
  throw new Error(`Blocked triage fixture request: ${method} ${url}`)
}
