'use client'

import { api, fetchWithAuth } from '@/shared/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import type {
  ArabicCodTemplateVariantId,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingState,
  OnboardingBillingPlanConfig,
  OnboardingSettingsPayload,
} from '@/features/onboarding'

/** One style a merchant may choose, with the message it sends. */
export interface CodTemplateDefinition {
  language: 'ar' | 'en'
  variant: ArabicCodTemplateVariantId | EnglishCodTemplateVariantId
  metaTemplateName: string
  metaLanguageCode: string
  bodyParameterOrder: Array<'customer' | 'store' | 'order' | 'total'>
  message: TemplateMessage
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
    /** The selected message per language. */
    messages: {
      ar: TemplateMessage
      en: TemplateMessage
    }
    /**
     * The reminder styles, present only while the backend offers them.
     * `selected` is null for "same as the first message".
     */
    reminder?: {
      selected: { ar: string | null; en: string | null }
      variants: { ar: CodTemplateDefinition[]; en: CodTemplateDefinition[] }
    }
    /** Arabic style by the customer's country, present only when offered. */
    arabicAuto?: { selected: boolean }
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
