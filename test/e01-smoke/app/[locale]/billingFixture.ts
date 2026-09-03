import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import type { OnboardingBillingResponse } from '@/features/onboarding/domain/onboarding.types'

let billingPosts = 0
let settingsReads = 0
export function billingFixtureCounts() {
  return { billingPosts, settingsReads }
}

function settings(): SettingsResponse {
  const mode =
    new URLSearchParams(window.location.search).get('entitlement') ?? 'manual'
  const shopify = mode === 'shopify'
  const preview = {
    greeting: 'Hello',
    body: 'Synthetic order',
    totalLabel: 'Total',
    ending: 'Please confirm',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  }
  return {
    state: {
      integrationId: 'e02-fixture-source',
      onboardingStatus: 'completed',
      isOnboardingComplete: true,
      storeName: 'E02 synthetic pilot',
      defaultLanguage: 'auto',
      isAutoVerifyEnabled: true,
      shippingCurrency: 'USD',
      avgShippingCost: 3,
      billingPlanId: 'starter',
      billingStatus:
        mode === 'blocked' ? 'frozen' : shopify ? 'active' : 'not_required',
      billingManagement:
        mode === 'missing'
          ? undefined
          : { mode: shopify ? 'shopify' : 'manual', canManageBilling: shopify },
      followUpEnabled: true,
      followUpDelayMinutes: 120,
      escalationEnabled: true,
      escalationDelayMinutes: 360,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: 'Africa/Cairo',
      sendDelayMinutes: 0,
    },
    billing: {
      plans:
        shopify || mode === 'missing'
          ? [
              {
                id: 'starter',
                name: 'Akeed Starter',
                amount: 0,
                currencyCode: 'USD',
                includedVerifications: 30,
              },
              {
                id: 'basic',
                name: 'Akeed Basic',
                amount: 9.99,
                currencyCode: 'USD',
                includedVerifications: 300,
              },
              {
                id: 'pro',
                name: 'Akeed Pro',
                amount: 22.99,
                currencyCode: 'USD',
                includedVerifications: 1000,
              },
              {
                id: 'business',
                name: 'Akeed Scale',
                amount: 49.99,
                currencyCode: 'USD',
                includedVerifications: 2500,
              },
            ]
          : [],
      isFreePlanClaimed: false,
      usage: {
        used: 30,
        limit: 30,
        periodStart: '2026-09-01',
        periodEnd: '2026-10-01',
      },
    },
    template: {
      languages: ['ar', 'en'],
      defaultPreviewLanguage: 'en',
      defaults: { ar: 'standard', en: 'friendly' },
      selected: { ar: 'standard', en: 'friendly' },
      variants: { ar: [], en: [] },
      previews: { ar: preview, en: preview },
    },
  }
}

export async function billingFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (url === '/api/settings' && options.method === 'GET') {
    settingsReads++
    return Response.json(settings())
  }
  if (url === '/api/onboarding/billing' && options.method === 'POST') {
    billingPosts++
    if (!settings().state.billingManagement?.canManageBilling)
      throw new Error('Blocked manual billing fixture request')
    const confirmation = new URL(window.location.href)
    confirmation.searchParams.set('approved', '1')
    const response = {
      confirmationUrl: confirmation.toString(),
    } satisfies OnboardingBillingResponse
    return Response.json(response)
  }
  throw new Error(`Blocked fixture request: ${options.method} ${url}`)
}
