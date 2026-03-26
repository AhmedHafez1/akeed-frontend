export type IntegrationOnboardingLanguage = 'auto' | 'en' | 'ar'

export type IntegrationOnboardingStatus = 'pending' | 'completed'

export interface IntegrationOnboardingState {
  integrationId: string
  onboardingStatus: IntegrationOnboardingStatus
  isOnboardingComplete: boolean
  storeName: string | null
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
  shippingCurrency: string
  avgShippingCost: number
  billingPlanId: OnboardingBillingPlanId | null
  billingStatus: string | null
  billingManagementUrl: string | null
}

export interface OnboardingStateResponse {
  state: IntegrationOnboardingState
}

export interface OnboardingSettingsPayload {
  storeName: string
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
  shippingCurrency?: string
  avgShippingCost?: number
}

export const ONBOARDING_BILLING_PLAN_IDS = [
  'starter',
  'growth',
  'pro',
  'scale',
] as const

export type OnboardingBillingPlanId = (typeof ONBOARDING_BILLING_PLAN_IDS)[number]

export interface OnboardingBillingPlan {
  id: OnboardingBillingPlanId
  name: string
  monthlyPriceLabel: string
  monthlyVolumeLabel: string
}

export interface OnboardingBillingResponse {
  confirmationUrl: string
}

export interface OnboardingBillingPlanConfig {
  id: OnboardingBillingPlanId
  name: string
  amount: number
  currencyCode: string
  includedVerifications: number
  usage?: {
    cappedAmount: number
    terms: string
  }
}

export interface OnboardingBillingPlansResponse {
  plans: OnboardingBillingPlanConfig[]
  isFreePlanClaimed: boolean
}
