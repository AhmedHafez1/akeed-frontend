'use client'

import { fetchWithAuth } from '@/shared/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import type {
  IntegrationOnboardingState,
  OnboardingBillingPlanConfig,
  OnboardingSettingsPayload,
} from '@/features/onboarding'

export interface MessageTemplatePreview {
  greeting: string
  body: string
  totalLabel: string
  ending: string
  confirmButton: string
  cancelButton: string
}

export interface SettingsResponse {
  state: IntegrationOnboardingState
  billing: {
    plans: OnboardingBillingPlanConfig[]
    isFreePlanClaimed: boolean
    usage: {
      used: number
      limit: number
      periodStart: string
      periodEnd: string
    }
  }
  template: {
    languages: Array<'ar' | 'en'>
    defaultPreviewLanguage: 'ar' | 'en'
    previews: {
      ar: MessageTemplatePreview
      en: MessageTemplatePreview
    }
  }
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const response = await fetchWithAuth('/api/settings', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return parseJsonResponse<SettingsResponse>(response)
}

export async function updateSettings(
  payload: OnboardingSettingsPayload
): Promise<SettingsResponse> {
  const response = await fetchWithAuth('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return parseJsonResponse<SettingsResponse>(response)
}
