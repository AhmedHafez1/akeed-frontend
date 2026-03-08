'use client'

import { fetchWithAuth } from '@/shared/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import type {
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
  OnboardingBillingPlansResponse,
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

export async function fetchOnboardingBillingPlans(): Promise<OnboardingBillingPlansResponse> {
  const response = await fetchWithAuth('/api/onboarding/billing/plans', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const payload = await parseJsonResponse<OnboardingBillingPlansResponse>(response)

  // Defensive normalization in case the backend returns duplicated plan IDs.
  const dedupedPlans = new Map<OnboardingBillingPlanId, OnboardingBillingPlanConfig>()
  for (const plan of payload.plans) {
    dedupedPlans.set(plan.id, plan)
  }

  return { plans: [...dedupedPlans.values()] }
}
