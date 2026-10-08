import type {
  IntegrationOnboardingState,
  OnboardingSettingsPayload,
} from '@/features/onboarding'
import type {
  OnboardingTestAttempt,
  OnboardingTestState,
} from '@/features/onboarding/domain/onboarding.types'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'

/*
 * In-memory backend for the standalone onboarding v2 fixture
 * (/onboarding?step=store|test|done). Query parameters pick a scenario:
 *
 *   role=owner|admin|viewer       viewer is read-only (writes answer 403)
 *   entitlement=blocked           /complete answers 409 ONBOARDING_BLOCKED
 *   account=suspended             the suspended-account notice
 *   backend=unavailable           Akeed's WhatsApp is down: POST /test → 502
 *   backend=down                  every call fails (the load-error screen)
 *   phone=saved                   resume with a saved number (step test)
 *   slow=state                    the state read never answers (loading UI)
 *
 * The test moves from sent to delivered about two seconds after it is sent;
 * the page's "Simulate tap Confirm" control stands in for the merchant.
 */

let scenario = ''
let state: IntegrationOnboardingState
let attempt: OnboardingTestAttempt | null = null
let lastSentAt: number | null = null
let sentToday = 0
let reads = 0
let writes = 0
let tests = 0
let skips = 0
let completions = 0

const COOLDOWN_MS = 30_000
const DAILY_LIMIT = 5

function params() {
  return new URLSearchParams(window.location.search)
}

function currentScenario() {
  const query = params()
  return [
    query.get('role') ?? 'owner',
    query.get('entitlement') ?? 'active',
    query.get('backend') ?? 'available',
    query.get('account') ?? 'active',
    query.get('phone') ?? 'none',
  ].join(':')
}

function initialize() {
  const nextScenario = currentScenario()
  if (scenario === nextScenario && state) return
  scenario = nextScenario
  attempt = null
  lastSentAt = null
  sentToday = 0
  reads = 0
  writes = 0
  tests = 0
  skips = 0
  completions = 0
  const query = params()
  const role = query.get('role') ?? 'owner'
  const entitled = query.get('entitlement') !== 'blocked'
  const accountStatus =
    query.get('account') === 'suspended'
      ? ('suspended' as const)
      : ('active' as const)
  const canManage = role === 'owner' || role === 'admin'
  state = {
    integrationId: 'e03-onboarding-source',
    source: {
      platformType: 'standalone',
      identity: 'standalone:e03-fixture-org',
    },
    onboardingStatus: 'pending',
    isOnboardingComplete: false,
    // Prefilled from the signup "store name", as the backend does.
    storeName: 'متجر نور',
    defaultLanguage: 'auto',
    isAutoVerifyEnabled: true,
    assumeCodWhenPaymentMissing: false,
    shippingCurrency: 'USD',
    avgShippingCost: 0,
    billingPlanId: null,
    billingStatus: null,
    billingManagement: { mode: 'manual', canManageBilling: false },
    followUpEnabled: true,
    followUpDelayMinutes: 120,
    escalationEnabled: true,
    escalationDelayMinutes: 360,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Africa/Cairo',
    sendDelayMinutes: 0,
    merchantWhatsappPhone:
      query.get('phone') === 'saved' ? '+201012345670' : null,
    permissions: {
      canUpdateConfiguration: canManage,
      canCompleteOnboarding: canManage,
    },
    standaloneSetup: {
      canComplete: entitled && accountStatus === 'active',
      blockedReasons:
        accountStatus === 'suspended'
          ? ['account_suspended']
          : entitled
            ? []
            : ['pilot_entitlement_missing'],
      accountStatus,
    },
  }
}

const TEMPLATE_MESSAGES = {
  ar: templateMessageFixture(
    [
      'أهلًا بك {{customer}}',
      'شكرًا لتسوّقك من {{store}}. طلبك رقم {{order}} بقيمة {{total}} جاهز تقريبًا للشحن.',
      'إجمالي الطلب: {{total}}',
      'يرجى تأكيد الطلب لنتمكن من إرساله إليك بأسرع وقت.',
    ],
    ['تأكيد الطلب', 'إلغاء الطلب'],
    { direction: 'rtl' }
  ),
  en: templateMessageFixture(
    [
      'Hi {{customer}}',
      'Thanks for shopping at {{store}}. Your order {{order}} of {{total}} is almost ready to ship.',
      'Order total: {{total}}',
      'Please confirm the order so we can send it to you as soon as possible.',
    ],
    ['Confirm order', 'Cancel order']
  ),
}

function testLanguage(): 'ar' | 'en' {
  if (state.defaultLanguage === 'ar' || state.defaultLanguage === 'en') {
    return state.defaultLanguage
  }
  const phone = state.merchantWhatsappPhone ?? ''
  return /^\+(20|966|971|973|974|965|968|962|212)/.test(phone) ? 'ar' : 'en'
}

/** Moves a sent test on to delivered after two seconds, as WhatsApp would. */
function advance() {
  if (!attempt || !attempt.sentAt) return
  if (
    attempt.status === 'sent' &&
    Date.now() - new Date(attempt.sentAt).getTime() > 2000
  ) {
    attempt = {
      ...attempt,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    }
  }
}

function testState(): OnboardingTestState {
  advance()
  const language = testLanguage()
  return {
    phone: state.merchantWhatsappPhone ?? null,
    language,
    message: TEMPLATE_MESSAGES[language],
    sample: {
      customerName: language === 'ar' ? 'أحمد' : 'Ahmed',
      orderNumber: 'TEST-1',
      total: '250',
      currency: state.shippingCurrency,
      storeName: state.storeName ?? '',
    },
    test: attempt,
    resendAvailableAt: lastSentAt
      ? new Date(lastSentAt + COOLDOWN_MS).toISOString()
      : null,
    sendsRemainingToday: Math.max(0, DAILY_LIMIT - sentToday),
    testConfirmedAt:
      attempt?.status === 'confirmed' ? attempt.confirmedAt : null,
    testSkippedAt: null,
  }
}

export function onboardingFixtureCounts() {
  initialize()
  return {
    reads,
    writes,
    tests,
    skips,
    completions,
    state: state.onboardingStatus,
    test: attempt?.status ?? null,
  }
}

/** The merchant tapped "Confirm order" on their phone. */
export function simulateOnboardingTap() {
  initialize()
  if (!attempt) return
  const now = new Date().toISOString()
  attempt = {
    ...attempt,
    status: 'confirmed',
    deliveredAt: attempt.deliveredAt ?? now,
    confirmedAt: now,
  }
}

export function isOnboardingFixture() {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.endsWith('/onboarding')
  )
}

const readOnly = () =>
  Response.json(
    { message: 'Read only', code: 'ONBOARDING_CONFIGURATION_READ_ONLY' },
    { status: 403 }
  )

export async function onboardingFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  initialize()
  const backend = params().get('backend')
  if (backend === 'down') {
    return Response.json(
      { message: 'Synthetic backend unavailable', code: 'UNAVAILABLE' },
      { status: 503 }
    )
  }
  const method = options.method ?? 'GET'
  const canManage = state.permissions.canUpdateConfiguration

  if (url === '/api/onboarding/state' && method === 'GET') {
    if (params().get('slow') === 'state') {
      return new Promise<Response>(() => undefined)
    }
    reads++
    return Response.json({ state })
  }

  if (url === '/api/settings' && method === 'GET') {
    return Response.json({ state, template: { messages: TEMPLATE_MESSAGES } })
  }

  if (url === '/api/billing/credits' && method === 'GET') {
    return Response.json({
      billingEnabled: true,
      status: 'active',
      postedBalance: 30,
      heldCredits: 0,
      availableCredits: 30,
      debtCredits: 0,
      lowBalanceThreshold: 5,
      freeGrant: { granted: true, quantity: 30, grantedAt: null },
      price: { unitPriceMinor: 200, currency: 'EGP' },
      range: { min: 100, max: 5000, step: 100 },
      canPurchase: canManage,
      purchaseDenialReason: null,
    })
  }

  if (url === '/api/onboarding/settings' && method === 'PATCH') {
    if (!canManage) return readOnly()
    writes++
    const payload = JSON.parse(
      String(options.body)
    ) as OnboardingSettingsPayload
    state = {
      ...state,
      ...payload,
      shippingCurrency: payload.shippingCurrency ?? state.shippingCurrency,
      timezone: payload.timezone ?? state.timezone,
    }
    return Response.json({ state })
  }

  if (url === '/api/onboarding/test' && method === 'GET') {
    return Response.json(testState())
  }

  if (url === '/api/onboarding/test' && method === 'POST') {
    if (!canManage) return readOnly()
    tests++
    if (backend === 'unavailable') {
      return Response.json(
        {
          message: 'WhatsApp could not accept the test message.',
          code: 'TEST_VERIFICATION_PROVIDER_FAILED',
        },
        { status: 502 }
      )
    }
    if (lastSentAt && Date.now() - lastSentAt < COOLDOWN_MS) {
      return Response.json(
        { message: 'Cooldown', code: 'ONBOARDING_TEST_COOLDOWN' },
        { status: 429 }
      )
    }
    if (sentToday >= DAILY_LIMIT) {
      return Response.json(
        { message: 'Daily limit', code: 'ONBOARDING_TEST_DAILY_LIMIT' },
        { status: 429 }
      )
    }
    lastSentAt = Date.now()
    sentToday++
    attempt = {
      verificationId: `e03-test-${sentToday}`,
      status: 'sent',
      sentAt: new Date(lastSentAt).toISOString(),
      deliveredAt: null,
      readAt: null,
      confirmedAt: null,
      canceledAt: null,
    }
    return Response.json(testState())
  }

  if (url === '/api/onboarding/test/skip' && method === 'POST') {
    if (!canManage) return readOnly()
    skips++
    return Response.json(testState())
  }

  if (url === '/api/onboarding/complete' && method === 'POST') {
    completions++
    if (!state.permissions.canCompleteOnboarding) {
      return Response.json({ message: 'Read only' }, { status: 403 })
    }
    if (!state.standaloneSetup?.canComplete) {
      return Response.json(
        {
          message: 'Blocked',
          code: 'ONBOARDING_BLOCKED',
          blockedReasons: state.standaloneSetup?.blockedReasons ?? [],
        },
        { status: 409 }
      )
    }
    state = {
      ...state,
      onboardingStatus: 'completed',
      isOnboardingComplete: true,
    }
    return Response.json({ state })
  }

  throw new Error(`Blocked onboarding fixture request: ${method} ${url}`)
}
