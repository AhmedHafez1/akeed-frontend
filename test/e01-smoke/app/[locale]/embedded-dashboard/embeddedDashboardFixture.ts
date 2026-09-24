import type {
  DashboardOverview,
  VerificationItem,
} from '@/features/dashboard/model/dashboard.model'

/*
 * The embedded dashboard and confirmations list over synthetic data shaped
 * like the redesign mockups: 28 orders in the period, 19 confirmed, 6 canceled
 * by the customer and 3 waiting on the merchant. No network, no provider.
 *
 * Scenarios (`?scenario=`): `empty` (a new shop), `error` (every read fails),
 * `limit` (plan used up), `quiet` (usage under 80%), `viewer` (read-only role).
 */

export function isEmbeddedDashboardFixture() {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.endsWith('/embedded-dashboard')
  )
}

function scenario() {
  return new URLSearchParams(window.location.search).get('scenario') ?? ''
}

const hour = 3_600_000
const now = Date.parse('2026-09-24T09:00:00Z')
const at = (hoursAgo: number) => new Date(now - hoursAgo * hour).toISOString()
const confirm = [
  { action: 'merchant_manual_confirmation' as const, supported: true },
]

function base(
  index: number,
  overrides: Partial<VerificationItem>
): VerificationItem {
  const created = at(24 * 2 + index * 5)
  return {
    id: `embedded-${index}`,
    order_id: `embedded-order-${index}`,
    order_number: `${1138 - index}`,
    external_order_id: `55500${1138 - index}`,
    platform: 'shopify',
    customer_name: index % 3 === 1 ? 'Guest' : 'Abdelghany Hafez',
    customer_phone: index % 2 ? '+201148675077' : '+201007611456',
    total_price: ['2629.95', '49.95', '2679.90', '1025.00'][index % 4],
    currency: 'USD',
    status: 'confirmed',
    reason: null,
    is_test: false,
    capabilities: [],
    created_at: created,
    last_sent_at: created,
    delivered_at: created,
    read_at: created,
    confirmed_at: at(24 * 2 + index * 5 - 1),
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    updated_at: at(24 * 2 + index * 5 - 1),
    action_reason: null,
    confirmation_source: 'customer',
    ...overrides,
  }
}

function buildRows(): VerificationItem[] {
  const rows: VerificationItem[] = [
    base(0, {
      status: 'read',
      confirmed_at: null,
      follow_up_sent_at: at(30),
      follow_up_attempts: 1,
      action_reason: 'no_reply_after_follow_up',
      capabilities: confirm,
      updated_at: at(40),
    }),
    base(1, {}),
    base(2, {
      follow_up_sent_at: at(55),
      confirmed_at: at(50),
    }),
    base(3, {
      status: 'canceled',
      confirmed_at: null,
      canceled_at: at(60),
      cancellation_source: 'customer',
      canceled_in_store: true,
    }),
    base(4, {
      follow_up_sent_at: at(70),
      confirmed_at: at(66),
    }),
    base(5, {
      status: 'canceled',
      confirmed_at: null,
      canceled_at: at(72),
      cancellation_source: 'customer',
      canceled_in_store: true,
    }),
  ]
  for (let index = 6; index < 28; index++) {
    rows.push(
      index === 9
        ? base(index, {
            order_number: '1129',
            customer_name: 'محمد علي',
            status: 'read',
            confirmed_at: null,
            action_reason: 'read_no_reply',
            capabilities: confirm,
          })
        : index === 11
          ? base(index, {
              order_number: '1127',
              customer_name: 'سارة أحمد',
              status: 'failed',
              confirmed_at: null,
              delivered_at: null,
              read_at: null,
              reason: 'provider_delivery_failed',
              failure_code: '131026',
              action_reason: 'delivery_failed',
              capabilities: confirm,
            })
          : index % 6 === 0
            ? base(index, {
                status: 'canceled',
                confirmed_at: null,
                canceled_at: at(90 + index),
                cancellation_source: 'customer',
              })
            : base(index, {})
    )
  }
  return rows
}

let rows = buildRows()
let loadedScenario = ''
const requests: string[] = []

function ensureScenario() {
  if (loadedScenario === scenario()) return
  loadedScenario = scenario()
  rows = loadedScenario === 'empty' ? [] : buildRows()
}

function countOf(filter: (row: VerificationItem) => boolean) {
  return rows.filter(filter).length
}

function overview(): DashboardOverview {
  const empty = scenario() === 'empty'
  const confirmed = countOf((row) => row.status === 'confirmed')
  const canceled = countOf((row) => row.status === 'canceled')
  const needsAction = rows.filter((row) => row.action_reason)
  const sent = empty ? 0 : 28
  const pct = (value: number) =>
    sent ? Number(((value / sent) * 100).toFixed(1)) : null
  const used = scenario() === 'limit' ? 30 : scenario() === 'quiet' ? 12 : 27
  return {
    date_range: 'last_30_days',
    reporting_timezone: 'Africa/Cairo',
    source: {
      status: 'connected',
      integration_id: 'embedded-source',
      platform_type: 'shopify',
    },
    settings: {
      auto_verify_enabled: true,
      follow_up_enabled: true,
      follow_up_delay_minutes: 360,
      quiet_hours_enabled: true,
      quiet_hours_start: '21:00',
      quiet_hours_end: '09:00',
    },
    usage: {
      used,
      limit: 30,
      percent: Math.round((used / 30) * 100),
      state: used >= 30 ? 'exhausted' : used >= 24 ? 'warning' : 'ok',
    },
    kpis: {
      confirmed: {
        count: confirmed,
        value: confirmed ? [{ currency: 'USD', amount: '28450.35' }] : [],
      },
      canceled_before_shipping: { count: canceled },
      confirmation_rate: {
        rate: pct(confirmed),
        confirmed,
        sent,
      },
    },
    funnel: {
      sent: { count: sent, percent_of_sent: pct(sent) },
      delivered: { count: empty ? 0 : 27, percent_of_sent: pct(27) },
      read: { count: empty ? 0 : 25, percent_of_sent: pct(25) },
      replied: {
        count: confirmed + canceled,
        percent_of_sent: pct(confirmed + canceled),
      },
      confirmed,
      customer_canceled: canceled,
      no_reply_yet: sent - confirmed - canceled,
    },
    needs_action: {
      count: needsAction.length,
      items: needsAction.map((row) => ({
        verification_id: row.id,
        order_id: row.order_id,
        external_order_id: row.external_order_id ?? null,
        platform: row.platform ?? null,
        order_number: row.order_number,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        total_price: row.total_price,
        currency: row.currency,
        reason: {
          type: row.action_reason!,
          since:
            row.action_reason === 'read_no_reply' ? at(14) : row.last_sent_at,
          hours: row.action_reason === 'read_no_reply' ? 14 : null,
          failure_code: row.failure_code ?? null,
        },
        capabilities: row.capabilities ?? [],
      })),
    },
    permissions: { can_confirm_orders: scenario() !== 'viewer' },
  }
}

function matchesTab(row: VerificationItem, tab: string | null) {
  switch (tab) {
    case 'needs_action':
      return Boolean(row.action_reason)
    case 'confirmed':
    case 'canceled':
    case 'failed':
      return row.status === tab
    default:
      return true
  }
}

function list(url: URL) {
  const tab = url.searchParams.get('tab')
  const digits = (url.searchParams.get('q') ?? '').replace(/\D/g, '')
  const limit = Number(url.searchParams.get('limit') ?? 20)
  const offset = Number(url.searchParams.get('cursor') ?? 0)
  const matching = rows.filter(
    (row) =>
      matchesTab(row, tab) &&
      (!digits ||
        (row.order_number ?? '').startsWith(digits) ||
        (row.customer_phone ?? '').replace(/\D/g, '').includes(digits))
  )
  const canWrite = scenario() !== 'viewer'
  return {
    data: matching.slice(offset, offset + limit),
    next_cursor:
      offset + limit < matching.length ? String(offset + limit) : null,
    total_count: matching.length,
    page_context: {
      source: {
        status: 'connected',
        integration_id: 'embedded-source',
        platform_type: 'shopify',
      },
      reporting_timezone: 'Africa/Cairo',
      automation: {
        is_auto_verify_enabled: true,
        follow_up_enabled: true,
        quiet_hours_enabled: true,
      },
      permissions: {
        can_send_test_verification: canWrite,
        can_cancel_orders: canWrite,
        can_create_manual_order: canWrite,
        can_retry_verifications: canWrite,
      },
      tab_counts: {
        all: rows.length,
        needs_action: countOf((row) => Boolean(row.action_reason)),
        confirmed: countOf((row) => row.status === 'confirmed'),
        canceled: countOf((row) => row.status === 'canceled'),
        failed: countOf((row) => row.status === 'failed'),
      },
    },
  }
}

const onboardingState = {
  state: {
    isAutoVerifyEnabled: true,
    quietHoursEnabled: true,
    quietHoursStart: '21:00',
    quietHoursEnd: '09:00',
    billingPlanId: 'starter',
    activation: {
      setupCompletedAt: at(400),
      testSentAt: at(399),
      testConfirmedAt: at(398),
      testSkippedAt: null,
      firstRealConfirmedAt: at(300),
      isLive: true,
      needsPlan: false,
    },
    usage: { used: 27, limit: 30, remaining: 3 },
  },
}

export async function embeddedDashboardRequest<T>(
  method: 'GET' | 'POST',
  path: string
): Promise<T> {
  ensureScenario()
  requests.push(`${method} ${path}`)
  await new Promise((resolve) => setTimeout(resolve, 250))
  const url = new URL(path, 'http://fixture.local')
  if (scenario() === 'error' && url.pathname !== '/api/onboarding/state')
    throw new Error('Synthetic read failure')
  if (method === 'GET' && url.pathname === '/api/onboarding/state')
    return onboardingState as T
  if (method === 'GET' && url.pathname === '/api/verifications/overview')
    return { overview: overview() } as T
  if (method === 'GET' && url.pathname === '/api/verifications')
    return list(url) as T
  const confirmMatch = /^\/api\/verifications\/([^/]+)\/confirm$/.exec(
    url.pathname
  )
  if (method === 'POST' && confirmMatch) {
    rows = rows.map((row) =>
      row.id === confirmMatch[1]
        ? {
            ...row,
            status: 'confirmed',
            confirmed_at: new Date(now).toISOString(),
            updated_at: new Date(now).toISOString(),
            confirmation_source: 'merchant_manual',
            action_reason: null,
          }
        : row
    )
    return {
      success: true,
      verificationId: confirmMatch[1],
      status: 'confirmed',
    } as T
  }
  throw new Error(`Unexpected embedded fixture ${method}: ${path}`)
}

export function embeddedDashboardRequests() {
  return [...requests]
}
