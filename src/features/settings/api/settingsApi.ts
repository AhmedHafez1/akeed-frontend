'use client'

import { api, fetchWithAuth } from '@/shared/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import type {
  ArabicCodTemplateVariantId,
  EnglishCodTemplateVariantId,
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

export interface CodTemplateDefinition {
  language: 'ar' | 'en'
  variant: ArabicCodTemplateVariantId | EnglishCodTemplateVariantId
  metaTemplateName: string
  metaLanguageCode: string
  bodyParameterOrder: Array<'customer' | 'store' | 'order' | 'total'>
  preview: MessageTemplatePreview
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
      periodEnd: string | null
    }
    /** Accepted customer messages in the last 30 days, tests excluded. */
    messagesSentLast30Days?: number
  }
  template: {
    languages: Array<'ar' | 'en'>
    defaultPreviewLanguage: 'ar' | 'en'
    defaults: {
      ar: ArabicCodTemplateVariantId
      en: EnglishCodTemplateVariantId
    }
    selected: {
      ar: ArabicCodTemplateVariantId
      en: EnglishCodTemplateVariantId
    }
    variants: {
      ar: CodTemplateDefinition[]
      en: CodTemplateDefinition[]
    }
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

/**
 * Rejects with the `ApiError` from `api.*`, so callers can map a stable
 * `code` to an inline field error.
 */
export function saveSettings(
  payload: OnboardingSettingsPayload
): Promise<SettingsResponse> {
  return api.patch<SettingsResponse>('/api/settings', payload)
}
