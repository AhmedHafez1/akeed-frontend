export type IntegrationOnboardingLanguage = 'auto' | 'en' | 'ar'

export type IntegrationOnboardingStatus = 'pending' | 'completed'

export type AutomationTimezone =
  | 'Asia/Riyadh'
  | 'Asia/Dubai'
  | 'Asia/Qatar'
  | 'Asia/Kuwait'
  | 'Asia/Bahrain'
  | 'Asia/Muscat'
  | 'Asia/Amman'
  | 'Africa/Cairo'
  | 'Africa/Casablanca'
  | 'UTC'

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
  followUpEnabled: boolean
  followUpDelayMinutes: number
  escalationEnabled: boolean
  escalationDelayMinutes: number
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timezone: AutomationTimezone
  sendDelayMinutes: number
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
  followUpEnabled?: boolean
  followUpDelayMinutes?: number
  escalationEnabled?: boolean
  escalationDelayMinutes?: number
  quietHoursEnabled?: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  timezone?: AutomationTimezone
  sendDelayMinutes?: number
}

export const ONBOARDING_BILLING_PLAN_IDS = [
  'starter',
  'basic',
  'pro',
  'business',
] as const

export type OnboardingBillingPlanId =
  (typeof ONBOARDING_BILLING_PLAN_IDS)[number]

export interface OnboardingBillingPlan {
  id: OnboardingBillingPlanId
  name: string
  monthlyPriceLabel: string
  monthlyVolumeLabel: string
  subtitle: string
  features: string[]
  ctaLabel: string
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
}

export interface OnboardingBillingPlansResponse {
  plans: OnboardingBillingPlanConfig[]
  isFreePlanClaimed: boolean
}
