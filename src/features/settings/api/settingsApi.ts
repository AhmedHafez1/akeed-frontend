'use client'

import { api, fetchWithAuth } from '@/shared/lib/auth'
import { getErrorMessage, parseJsonResponse } from '@/shared/lib/http'
import type {
  TemplateMessage,
  TemplateMessageVariable,
} from '@/shared/lib/templateMessage'
import type { MessageLanguage } from '@/shared/lib/messageLanguage'
import type {
  IntegrationOnboardingState,
  OnboardingBillingPlanConfig,
  OnboardingSettingsPayload,
} from '@/features/onboarding'

/** One style a merchant may choose, with the message it sends. */
export interface CodTemplateDefinition {
  language: MessageLanguage
  variant: string
  metaTemplateName: string
  metaLanguageCode: string
  bodyParameterOrder: TemplateMessageVariable[]
  message: TemplateMessage
  /**
   * Absent on a style the merchant may choose. Otherwise the style is shown
   * but locked: WhatsApp is still reviewing it (`in_review`), or it is
   * approved and not switched on yet (`not_enabled`).
   */
  availability?: TemplateStyleLock
}

export type TemplateStyleLock = 'in_review' | 'not_enabled'

type ByMessageLanguage<T> = Record<MessageLanguage, T>

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
    /** Every message language, usable or not, in display order. */
    languages: MessageLanguage[]
    /**
     * The languages a store can be set to. A language outside this list has
     * no approved message yet: its styles are locked and it cannot be saved.
     */
    liveLanguages: MessageLanguage[]
    defaultPreviewLanguage: MessageLanguage
    /** Style ids; null for a language that is not live. */
    defaults: ByMessageLanguage<string | null>
    selected: ByMessageLanguage<string | null>
    variants: ByMessageLanguage<CodTemplateDefinition[]>
    /** The selected message per language; null when it is not live. */
    messages: ByMessageLanguage<TemplateMessage | null>
    /**
     * The reminder styles, present only while the backend offers them.
     * `selected` is null for "same as the first message".
     */
    reminder?: {
      selected: ByMessageLanguage<string | null>
      variants: ByMessageLanguage<CodTemplateDefinition[]>
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
