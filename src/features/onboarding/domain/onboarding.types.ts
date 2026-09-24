export interface BillingManagement {
  mode: 'shopify' | 'manual'
  canManageBilling: boolean
}

export type IntegrationOnboardingLanguage = 'auto' | 'en' | 'ar'

export type ArabicCodTemplateVariantId =
  | 'standard'
  | 'egyptian'
  | 'gulf'
  | 'short'

export type EnglishCodTemplateVariantId =
  | 'friendly'
  | 'professional'
  | 'direct'
  | 'short'

export type IntegrationOnboardingStatus = 'pending' | 'completed'

export type CreditAccountStatus = 'active' | 'suspended'

export type StandaloneSetupBlockedReason =
  | 'source_invalid'
  | 'account_suspended'
  | 'pilot_entitlement_missing'
  | 'merchant_name_missing'
  | 'language_invalid'
  | 'cod_default_invalid'
  | 'automation_invalid'
  | 'timezone_invalid'

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
  source: {
    platformType: string
    identity: string
  }
  onboardingStatus: IntegrationOnboardingStatus
  isOnboardingComplete: boolean
  storeName: string | null
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
  assumeCodWhenPaymentMissing: boolean
  shippingCurrency: string
  avgShippingCost: number
  billingPlanId: OnboardingBillingPlanId | null
  billingStatus: string | null
  billingManagement?: BillingManagement
  followUpEnabled: boolean
  followUpDelayMinutes: number
  escalationEnabled: boolean
  escalationDelayMinutes: number
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  /** A curated zone, or the store's own Shopify zone (`shopTimezone`). */
  timezone: string
  /** The Shopify store's IANA zone, offered first as "store time". */
  shopTimezone?: string | null
  sendDelayMinutes: number
  /** The merchant's own number for the free test; prefilled from the shop. */
  merchantWhatsappPhone?: string | null
  /** Template language the merchant's own test message is sent in. */
  testSendLanguage?: 'ar' | 'en'
  activation?: OnboardingActivation
  usage?: OnboardingUsage | null
  permissions: {
    canUpdateConfiguration: boolean
    canCompleteOnboarding: boolean
  }
  standaloneSetup: {
    canComplete: boolean
    blockedReasons: StandaloneSetupBlockedReason[]
    accountStatus: CreditAccountStatus | null
  } | null
}

export interface OnboardingActivation {
  setupCompletedAt: string | null
  testSentAt: string | null
  testConfirmedAt: string | null
  testSkippedAt: string | null
  firstRealConfirmedAt: string | null
  isLive: boolean
  needsPlan: boolean
}

export interface OnboardingUsage {
  used: number
  limit: number
  remaining: number
}

export interface OnboardingStateResponse {
  state: IntegrationOnboardingState
}

export interface CompleteOnboardingSetupPayload {
  storeName: string
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
  merchantWhatsappPhone: string
}

export type OnboardingClientEvent = 'setup_started' | 'onboarding_exited'

export type OnboardingTestStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'confirmed'
  | 'canceled'
  | 'expired'
  | 'failed'
  | 'no_reply'

export interface OnboardingTestAttempt {
  verificationId: string
  status: OnboardingTestStatus
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  confirmedAt: string | null
  canceledAt: string | null
}

export interface OnboardingTestTemplatePreview {
  greeting: string
  body: string
  totalLabel: string
  ending: string
  confirmButton: string
  cancelButton: string
}

/** GET/POST /api/onboarding/test: everything the test step renders. */
export interface OnboardingTestState {
  phone: string | null
  language: 'ar' | 'en'
  preview: OnboardingTestTemplatePreview
  sample: {
    customerName: string
    orderNumber: string
    total: string
    currency: string
    storeName: string
  }
  test: OnboardingTestAttempt | null
  resendAvailableAt: string | null
  sendsRemainingToday: number
  testConfirmedAt: string | null
  testSkippedAt: string | null
}

export interface OnboardingSettingsPayload {
  storeName: string
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
  assumeCodWhenPaymentMissing?: boolean
  shippingCurrency?: string
  avgShippingCost?: number
  followUpEnabled?: boolean
  followUpDelayMinutes?: number
  escalationEnabled?: boolean
  escalationDelayMinutes?: number
  quietHoursEnabled?: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  timezone?: string
  sendDelayMinutes?: number
  codTemplateArVariant?: ArabicCodTemplateVariantId
  codTemplateEnVariant?: EnglishCodTemplateVariantId
  merchantWhatsappPhone?: string
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
  billingManagement?: BillingManagement
  plans: OnboardingBillingPlanConfig[]
  isFreePlanClaimed: boolean
}

// ─── Standalone onboarding wizard (UI-only) ───────────────────────────────────
// These types describe the client-side three-step presentation of the existing
// settings payload. They intentionally do not affect the API contract.

export type StandaloneStep = 1 | 2 | 3

export interface StandaloneStepDefinition {
  id: StandaloneStep
  titleKey: string
  descriptionKey: string
  headingKey: string
  subheadingKey: string
}

export type StandaloneSetupFieldKey =
  | 'storeName'
  | 'sendDelayHours'
  | 'followUpDelayHours'
  | 'escalationDelayHours'
  | 'quietHours'

export type StandaloneSetupFieldErrors = Partial<
  Record<StandaloneSetupFieldKey, string>
>
