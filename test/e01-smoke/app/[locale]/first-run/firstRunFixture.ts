import type { DashboardOverviewResponse } from '@/features/dashboard/model/dashboard.model'
import type {
  OnboardingTestAttempt,
  OnboardingTestState,
} from '@/features/onboarding/domain/onboarding.types'

/*
 * In-memory backend for the standalone dashboard first-run fixture
 * (/first-run). Query parameters pick a scenario:
 *
 *   scenario=first-run      no real order yet, 30 credits (default)
 *   scenario=skipped-test   first run after skipping the onboarding test
 *   scenario=zero-balance   first run with no credits left
 *   scenario=active         a real order exists: the full dashboard
 *
 * "Send it to my phone" answers like the free onboarding test: sent at once,
 * delivered two seconds later. Nothing leaves the browser.
 */

export function isFirstRunFixture() {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.endsWith('/first-run')
  )
}

function scenario() {
  return (
    new URLSearchParams(window.location.search).get('scenario') ?? 'first-run'
  )
}

const PHONE = '+201012345670'
let attempt: OnboardingTestAttempt | null = null
let lastSentAt: number | null = null

function testState(): OnboardingTestState {
  if (attempt?.status === 'sent' && Date.now() - (lastSentAt ?? 0) > 2000) {
    attempt = {
      ...attempt,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    }
  }
  return {
    phone: PHONE,
    language: 'ar',
    preview: {
      greeting: 'أهلًا بك {{customer}}',
      body: 'شكرًا لتسوّقك من {{store}}. طلبك رقم {{order}} بقيمة {{total}} جاهز تقريبًا للشحن.',
      totalLabel: 'إجمالي الطلب: {{total}}',
      ending: 'يرجى تأكيد الطلب لنتمكن من إرساله إليك بأسرع وقت.',
      confirmButton: 'تأكيد الطلب',
      cancelButton: 'إلغاء الطلب',
    },
    sample: {
      customerName: 'أحمد',
      orderNumber: 'TEST-1',
      total: '250.00',
      currency: 'EGP',
      storeName: 'متجر نور',
    },
    test: attempt,
    resendAvailableAt: lastSentAt
      ? new Date(lastSentAt + 30_000).toISOString()
      : null,
    sendsRemainingToday: 4,
    testConfirmedAt: null,
    testSkippedAt:
      scenario() === 'skipped-test' ? '2026-09-29T08:00:00.000Z' : null,
  }
}

function onboardingState() {
  const current = scenario()
  return {
    state: {
      isAutoVerifyEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      billingPlanId: null,
      activation: {
        setupCompletedAt: '2026-09-29T07:55:00.000Z',
        testSentAt: null,
        testConfirmedAt: null,
        testSkippedAt:
          current === 'skipped-test' ? '2026-09-29T08:00:00.000Z' : null,
        firstRealConfirmedAt: null,
        hasRealOrders: current === 'active',
        isLive: true,
        needsPlan: false,
      },
      usage: null,
    },
  }
}

function overview(): DashboardOverviewResponse {
  const step = { count: 0, percent_of_sent: null }
  return {
    overview: {
      date_range: 'last_30_days',
      reporting_timezone: 'Africa/Cairo',
      source: {
        status: 'connected',
        integration_id: 'first-run-source',
        platform_type: 'standalone',
      },
      settings: {
        auto_verify_enabled: true,
        follow_up_enabled: true,
        follow_up_delay_minutes: 120,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
      },
      usage: null,
      kpis: {
        confirmed: { count: 0, value: [] },
        canceled_before_shipping: { count: 0 },
        confirmation_rate: { rate: null, confirmed: 0, sent: 0 },
      },
      funnel: {
        sent: step,
        delivered: step,
        read: step,
        replied: step,
        confirmed: 0,
        customer_canceled: 0,
        no_reply_yet: 0,
      },
      needs_action: { count: 0, items: [] },
      permissions: { can_confirm_orders: true },
    },
  }
}

function credits() {
  const available = scenario() === 'zero-balance' ? 0 : 30
  return {
    billingEnabled: true,
    bulkImportEnabled: true,
    status: 'active',
    postedBalance: available,
    heldCredits: 0,
    availableCredits: available,
    debtCredits: 0,
    lowBalanceThreshold: 10,
    freeGrant: {
      granted: true,
      quantity: 30,
      grantedAt: '2026-09-29T07:50:00.000Z',
    },
    price: { unitPriceMinor: 200, currency: 'EGP' },
    range: { min: 100, max: 5000, step: 50 },
    canPurchase: true,
    purchaseDenialReason: null,
  }
}

export function firstRunApiGet<T>(url: string): T {
  if (url === '/api/onboarding/state') return onboardingState() as T
  if (url.startsWith('/api/verifications/overview')) return overview() as T
  if (url.startsWith('/api/verifications?')) {
    const outOfCredits = scenario() === 'zero-balance'
    return {
      data: [],
      next_cursor: null,
      total_count: 0,
      page_context: {
        source: { status: 'connected' },
        permissions: { can_create_manual_order: true },
        usage: {
          limit: 0,
          remaining: 0,
          credit_denial: outOfCredits ? 'INSUFFICIENT_CREDITS' : null,
        },
      },
    } as T
  }
  throw new Error(`Unexpected first-run fixture GET: ${url}`)
}

export async function firstRunFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (url === '/api/billing/credits') return Response.json(credits())
  if (url === '/api/onboarding/test') {
    if ((options.method ?? 'GET') === 'POST') {
      lastSentAt = Date.now()
      attempt = {
        verificationId: 'first-run-test',
        status: 'sent',
        sentAt: new Date(lastSentAt).toISOString(),
        deliveredAt: null,
        readAt: null,
        confirmedAt: null,
        canceledAt: null,
      }
    }
    return Response.json(testState())
  }
  if (url.startsWith('/api/admin/'))
    return Response.json({ message: 'Not an admin' }, { status: 403 })
  throw new Error(`Unexpected first-run fixture request: ${url}`)
}
