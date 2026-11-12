import type {
  AdminStore,
  AdminStoreDetail,
  AdminStoresResponse,
} from '@/features/admin/admin.model'

/*
 * Synthetic admin stores for the store list and details pages: a COD store
 * whose orders turned non-COD, a reinstalled store without a plan, a paying
 * store that uninstalled, a partial drop and a healthy store. Times are
 * relative to now so "2h ago" stays true. Nothing here is a real store.
 */

const HOUR = 3_600_000
const at = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * HOUR).toISOString()

function base(
  id: string,
  name: string,
  plan: string | null,
  status: string | null
): AdminStore {
  const usage = { used: 842, limit: 1000, remaining: 158, percent: 84 }
  return {
    integration_id: id,
    org_id: `org-${id}`,
    platform: 'shopify',
    organization_name: name,
    store_name: name,
    shop_domain: `${name.toLowerCase().replaceAll(' ', '-')}.example.test`,
    source_identity: `${name.toLowerCase().replaceAll(' ', '-')}.example.test`,
    country_code: 'EG',
    customer_countries: { top: 'EG', share: 97, count: 2 },
    timezone: 'Africa/Cairo',
    installed_at: at(24 * 40),
    lifecycle_status: 'active',
    onboarding_status: 'completed',
    plan,
    subscription_status: status,
    usage,
    billing: { model: 'plan', plan, subscription_status: status, usage },
    auto_confirmation_enabled: true,
    test_message_status: 'delivered',
    first_eligible_real_order_at: at(24 * 38),
    activated_at: at(24 * 38),
    last_activity_at: at(2),
    health: {
      status: 'healthy',
      top_signal: null,
      signal_count: 0,
      signals: [],
      levels: {},
      details: {},
    },
    data_quality: [],
  }
}

function withSignals(
  store: AdminStore,
  health: Omit<AdminStore['health'], 'top_signal' | 'signal_count'>
): AdminStore {
  return {
    ...store,
    health: {
      ...health,
      top_signal: health.signals[0] ?? null,
      signal_count: health.signals.length,
    },
  }
}

const stores: AdminStore[] = [
  withSignals(base('store-cod', 'Cairo Fashion House', 'pro', 'active'), {
    status: 'critical',
    signals: ['orders_not_eligible', 'usage_attention'],
    levels: { orders_not_eligible: 'critical', usage_attention: 'attention' },
    details: {
      orders_not_eligible: {
        received: 13,
        eligible: 1,
        skipped: 12,
        top_reason: 'non_cod_payment_method',
        top_payment_method: 'manual',
      },
      usage_attention: { percent: 84, used: 842, limit: 1000 },
    },
  }),
  withSignals(
    {
      ...base('store-reinstalled', 'Nile Home Store', 'pro', 'cancelled'),
      installed_at: at(25),
    },
    {
      status: 'critical',
      signals: ['reinstalled_without_plan'],
      levels: { reinstalled_without_plan: 'critical' },
      details: {
        reinstalled_without_plan: {
          previous_plan: 'pro',
          lost_at: at(26),
          reinstalled_at: at(25),
        },
      },
    }
  ),
  withSignals(
    {
      ...base('store-uninstalled', 'Delta Beauty', 'pro', 'cancelled'),
      lifecycle_status: 'uninstalled',
    },
    {
      status: 'critical',
      signals: ['paid_store_uninstalled'],
      levels: { paid_store_uninstalled: 'critical' },
      details: {
        paid_store_uninstalled: {
          plan: 'pro',
          uninstalled_at: at(2),
          paid_through_at: at(-24 * 19 + 1),
        },
      },
    }
  ),
  withSignals(base('store-drop', 'Giza Electronics', 'basic', 'active'), {
    status: 'attention_required',
    signals: ['orders_not_eligible'],
    levels: { orders_not_eligible: 'attention' },
    details: {
      orders_not_eligible: {
        received: 9,
        eligible: 3,
        skipped: 6,
        top_reason: 'missing_payment_signal',
        top_payment_method: 'unknown',
      },
    },
  }),
  base('store-healthy', 'Alexandria Kids', 'basic', 'active'),
]

function localDay(daysAgo: number) {
  const date = new Date(Date.now() - daysAgo * 24 * HOUR)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function detail(store: AdminStore): AdminStoreDetail {
  const counts = [
    [21, 21, 0],
    [26, 25, 1],
    [18, 18, 0],
    [14, 14, 0],
    [15, 4, 11],
    [13, 0, 13],
    [5, 0, 5],
  ]
  return {
    ...store,
    owner_email: 'owner@example.test',
    merchant_whatsapp_phone: null,
    created_at: store.installed_at,
    last_synced_at: null,
    billing_activated_at: at(24 * 38),
    settings: {
      default_language: 'auto',
      shipping_currency: 'EGP',
      follow_up_enabled: true,
      follow_up_delay_minutes: 120,
      escalation_enabled: true,
      acknowledgment_enabled: true,
      auto_cancel_enabled: false,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      send_delay_minutes: 0,
    },
    milestones: [
      {
        key: 'installation_completed',
        at: store.installed_at,
        estimated: false,
      },
    ],
    order_intake: {
      time_zone: 'Africa/Cairo',
      days: counts.map(([received, eligible, skipped], index) => ({
        day: localDay(6 - index),
        received,
        eligible,
        skipped,
      })),
      skip_reasons: [
        { reason: 'non_cod_payment_method', count: 29 },
        { reason: 'auto_verify_disabled', count: 1 },
      ],
      payment_methods: [
        { name: 'Cash on Delivery (COD)', count: 83 },
        { name: 'manual', count: 29 },
      ],
    },
    reinstall:
      store.integration_id === 'store-reinstalled'
        ? {
            previous_plan: 'pro',
            lost_at: at(26),
            reinstalled_at: at(25),
            has_active_plan: false,
          }
        : null,
    verification_totals: {
      total: 412,
      test: 7,
      sent: 405,
      by_status: { confirmed: 330, canceled: 40, no_reply: 35 },
      failed_24h: 0,
      total_24h: 1,
    },
  }
}

/** Answers the store list, details and their side reads, or null. */
export function adminStoresFixtureRequest(url: string): Response | null {
  const path = url.split('?')[0]
  if (path === '/api/admin/stores') {
    const signal = new URLSearchParams(url.split('?')[1] ?? '').get('signal')
    const data = signal
      ? stores.filter((store) => store.health.signals.includes(signal))
      : stores
    const response: AdminStoresResponse = {
      summary: {
        currently_installed: 4,
        onboarding: 0,
        activated: 4,
        inactive: 0,
        uninstalled: 1,
        healthy: 1,
        attention_required: 1,
        critical: 3,
      },
      data,
      next_cursor: null,
      evaluated_at: new Date().toISOString(),
    }
    return Response.json(response)
  }
  const verifications = path.match(
    /^\/api\/admin\/stores\/([^/]+)\/verifications$/
  )
  if (verifications)
    return Response.json({ data: [], next_cursor: null, total_count: 0 })
  const one = path.match(/^\/api\/admin\/stores\/([^/]+)$/)
  if (one) {
    const store = stores.find((item) => item.integration_id === one[1])
    if (!store)
      return Response.json({ message: 'Store not found' }, { status: 404 })
    return Response.json({
      store: detail(store),
      evaluated_at: new Date().toISOString(),
    })
  }
  if (path.startsWith('/api/admin/whatsapp-connections/'))
    return Response.json({ message: 'Not found' }, { status: 404 })
  return null
}
