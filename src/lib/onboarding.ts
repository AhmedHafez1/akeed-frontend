'use client'

import { fetchWithAuth } from '@/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/lib/http'
import type {
  OnboardingBillingPlanId,
  OnboardingBillingResponse,
  OnboardingSettingsPayload,
  OnboardingStateResponse,
} from '@/types/embedded-onboarding.model'

export async function fetchOnboardingState(): Promise<OnboardingStateResponse> {
  const response = await fetchWithAuth('/api/onboarding/state', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return parseJsonResponse<OnboardingStateResponse>(response)
}

export async function updateOnboardingSettings(
  payload: OnboardingSettingsPayload
): Promise<OnboardingStateResponse> {
  const response = await fetchWithAuth('/api/onboarding/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
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
    throw new Error(await getErrorMessage(response))
  }

  return parseJsonResponse<OnboardingBillingResponse>(response)
}
