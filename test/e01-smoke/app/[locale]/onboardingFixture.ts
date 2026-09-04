import type {
  IntegrationOnboardingState,
  OnboardingSettingsPayload,
} from '@/features/onboarding'

let scenario = ''
let state: IntegrationOnboardingState
let reads = 0
let writes = 0
let completions = 0

function currentScenario() {
  const params = new URLSearchParams(window.location.search)
  return `${params.get('role') ?? 'owner'}:${
    params.get('entitlement') ?? 'active'
  }:${params.get('backend') ?? 'available'}`
}

function initialize() {
  const nextScenario = currentScenario()
  if (scenario === nextScenario && state) return
  scenario = nextScenario
  reads = 0
  writes = 0
  completions = 0
  const params = new URLSearchParams(window.location.search)
  const role = params.get('role') ?? 'owner'
  const entitled = params.get('entitlement') !== 'blocked'
  const canManage = role === 'owner' || role === 'admin'
  state = {
    integrationId: 'e03-onboarding-source',
    source: {
      platformType: 'standalone',
      identity: 'standalone:e03-fixture-org',
    },
    onboardingStatus: 'pending',
    isOnboardingComplete: false,
    storeName: '',
    defaultLanguage: 'auto',
    isAutoVerifyEnabled: false,
    assumeCodWhenPaymentMissing: false,
    shippingCurrency: 'USD',
    avgShippingCost: 3,
    billingPlanId: entitled ? 'starter' : null,
    billingStatus: entitled ? 'not_required' : null,
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
    permissions: {
      canUpdateConfiguration: canManage,
      canCompleteOnboarding: canManage,
    },
    standaloneSetup: {
      canComplete: false,
      blockedReasons: entitled
        ? ['merchant_name_missing']
        : ['pilot_entitlement_missing', 'merchant_name_missing'],
    },
  }
}

export function onboardingFixtureCounts() {
  initialize()
  return { reads, writes, completions, state: state.onboardingStatus }
}

export async function onboardingFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  initialize()
  const params = new URLSearchParams(window.location.search)
  if (params.get('backend') === 'unavailable') {
    return Response.json(
      { message: 'Synthetic backend unavailable', code: 'UNAVAILABLE' },
      { status: 503 }
    )
  }

  if (url === '/api/onboarding/state' && options.method === 'GET') {
    reads++
    return Response.json({ state })
  }

  if (url === '/api/onboarding/settings' && options.method === 'PATCH') {
    if (!state.permissions.canUpdateConfiguration) {
      return Response.json(
        { message: 'Read only', code: 'ONBOARDING_CONFIGURATION_READ_ONLY' },
        { status: 403 }
      )
    }
    writes++
    const payload = JSON.parse(
      String(options.body)
    ) as OnboardingSettingsPayload
    state = {
      ...state,
      ...payload,
      storeName: payload.storeName,
      standaloneSetup: {
        canComplete: state.billingStatus === 'not_required',
        blockedReasons:
          state.billingStatus === 'not_required'
            ? []
            : ['pilot_entitlement_missing'],
      },
    }
    return Response.json({ state })
  }

  if (url === '/api/onboarding/complete' && options.method === 'POST') {
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

  throw new Error(
    `Blocked onboarding fixture request: ${options.method} ${url}`
  )
}
