'use client'

import { fetchWithAuth } from '@/shared/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import type {
  CompleteOnboardingSetupPayload,
  OnboardingClientEvent,
  OnboardingTestState,
  OnboardingTestTemplatePreview,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
  OnboardingBillingPlansResponse,
  OnboardingBillingResponse,
  OnboardingSettingsPayload,
  OnboardingStateResponse,
  SetupBlockedReason,
} from '@/features/onboarding/domain/onboarding.types'

export class OnboardingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
    readonly blockedReasons: SetupBlockedReason[] = []
  ) {
    super(message)
  }
}

/** The store already used the one-time free (starter) plan. */
export function isFreePlanAlreadyClaimedError(error: unknown): boolean {
  return (
    error instanceof OnboardingApiError &&
    error.code === 'BILLING_FREE_PLAN_ALREADY_CLAIMED'
  )
}

async function getOnboardingApiError(response: Response) {
  let message = `Request failed with status ${response.status}`
  let code: string | null = null
  let blockedReasons: SetupBlockedReason[] = []
  try {
    const body = await parseJsonResponse<{
      message?: string | string[]
      code?: string
      blockedReasons?: SetupBlockedReason[]
    }>(response)
    message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message || message
    code = body.code ?? null
    blockedReasons = body.blockedReasons ?? []
  } catch {
    // Status remains sufficient for a retryable localized error.
  }
  return new OnboardingApiError(message, response.status, code, blockedReasons)
}

/**
 * The organization's source as the last state read saw it: its platform,
 * `missing` when it has none yet, or `null` before any read.
 */
export type KnownOnboardingSource = { platformType: string } | 'missing' | null

let knownOnboardingSource: KnownOnboardingSource = null
let knownSignupSource: string | null = null

/** Lets setup pick its skin without a second read after the route guard's. */
export function getKnownOnboardingSource(): KnownOnboardingSource {
  return knownOnboardingSource
}

/**
 * The store platform chosen at signup, as the route guard read it from the
 * session. Setup uses it to pick the connect skin of a source-less
 * organization; the guard has already decided the choice is connectable.
 */
export function rememberSignupSource(signupSourceId: unknown): void {
  knownSignupSource = typeof signupSourceId === 'string' ? signupSourceId : null
}

export function getKnownSignupSource(): string | null {
  return knownSignupSource
}

export function clearKnownOnboardingSource(): void {
  knownOnboardingSource = null
  knownSignupSource = null
}

export async function fetchOnboardingState(): Promise<OnboardingStateResponse> {
  const response = await fetchWithAuth('/api/onboarding/state', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = await getOnboardingApiError(response)
    if (error.code === 'ONBOARDING_SOURCE_MISSING') {
      knownOnboardingSource = 'missing'
    }
    throw error
  }

  const result = await parseJsonResponse<OnboardingStateResponse>(response)
  knownOnboardingSource = { platformType: result.state.source.platformType }
  return result
}

export async function updateOnboardingSettings(
  payload: OnboardingSettingsPayload
): Promise<OnboardingStateResponse> {
  const response = await fetchWithAuth('/api/onboarding/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingStateResponse>(response)
}

export async function completeOnboardingSetup(
  payload: CompleteOnboardingSetupPayload
): Promise<OnboardingStateResponse> {
  const response = await fetchWithAuth('/api/onboarding/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingStateResponse>(response)
}

export async function fetchOnboardingTest(): Promise<OnboardingTestState> {
  const response = await fetchWithAuth('/api/onboarding/test', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingTestState>(response)
}

export async function sendOnboardingTest(options: {
  resend: boolean
}): Promise<OnboardingTestState> {
  const response = await fetchWithAuth('/api/onboarding/test', {
    method: 'POST',
    body: JSON.stringify({ resend: options.resend }),
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingTestState>(response)
}

export async function skipOnboardingTest(): Promise<OnboardingTestState> {
  const response = await fetchWithAuth('/api/onboarding/test/skip', {
    method: 'POST',
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingTestState>(response)
}

export interface OnboardingTemplatePreviews {
  ar: OnboardingTestTemplatePreview
  en: OnboardingTestTemplatePreview
}

/**
 * The merchant's selected confirmation template in both languages, so the
 * setup preview can follow the language the merchant is choosing before
 * anything is saved. Read from the settings endpoint, which serves pending
 * sources too.
 */
export async function fetchTemplatePreviews(): Promise<OnboardingTemplatePreviews> {
  const response = await fetchWithAuth('/api/settings', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  const body = await parseJsonResponse<{
    template: { previews: OnboardingTemplatePreviews }
  }>(response)
  return body.template.previews
}

/**
 * Funnel events the browser alone can observe. Best effort: `keepalive` lets
 * an exit event outlive the page, and a failure never reaches the merchant.
 */
export async function postOnboardingEvent(
  name: OnboardingClientEvent,
  step?: 'setup' | 'test' | 'success'
): Promise<void> {
  try {
    await fetchWithAuth('/api/onboarding/events', {
      method: 'POST',
      body: JSON.stringify(step ? { name, step } : { name }),
      keepalive: true,
    })
  } catch {
    // Observability only; the merchant's flow must not depend on it.
  }
}

export async function completeStandaloneOnboarding(): Promise<OnboardingStateResponse> {
  const response = await fetchWithAuth('/api/onboarding/complete', {
    method: 'POST',
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingStateResponse>(response)
}

export async function createOnboardingBilling(
  planId: OnboardingBillingPlanId,
  host?: string
): Promise<OnboardingBillingResponse> {
  const response = await fetchWithAuth('/api/onboarding/billing', {
    method: 'POST',
    body: JSON.stringify({ planId, host }),
  })

  if (!response.ok) {
    throw await getOnboardingApiError(response)
  }

  return parseJsonResponse<OnboardingBillingResponse>(response)
}

export async function fetchOnboardingBillingPlans(): Promise<OnboardingBillingPlansResponse> {
  const response = await fetchWithAuth('/api/onboarding/billing/plans', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const payload =
    await parseJsonResponse<OnboardingBillingPlansResponse>(response)

  // Defensive normalization in case the backend returns duplicated plan IDs.
  const dedupedPlans = new Map<
    OnboardingBillingPlanId,
    OnboardingBillingPlanConfig
  >()
  for (const plan of payload.plans) {
    dedupedPlans.set(plan.id, plan)
  }

  return {
    plans: [...dedupedPlans.values()],
    isFreePlanClaimed: payload.isFreePlanClaimed,
    billingManagement: payload.billingManagement,
  }
}
