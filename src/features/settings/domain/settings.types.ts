import type {
  AutomationTimezone,
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/features/onboarding'

export interface SettingsSelectOption<TValue extends string = string> {
  label: string
  value: TValue
}

export interface SettingsPlanOption {
  id: OnboardingBillingPlanId
  name: string
  priceLabel: string
  volumeLabel: string
}

export interface SettingsUsageData {
  used: number
  limit: number
  periodStart: string
  periodEnd: string
  usedLabel: string
  limitLabel: string
  upgradePrompt: string | null
}

export interface SettingsTemplatePreview {
  greeting: string
  body: string
  totalLabel: string
  ending: string
  confirmButton: string
  cancelButton: string
}

export interface SettingsSkinProps {
  storeName: string
  storeNameError: string | undefined
  defaultLanguage: IntegrationOnboardingLanguage
  languageOptions: ReadonlyArray<
    SettingsSelectOption<IntegrationOnboardingLanguage>
  >
  shippingCurrency: string
  shippingCurrencyOptions: ReadonlyArray<SettingsSelectOption>
  avgShippingCost: string
  avgShippingCostError: string | undefined
  isAutoVerifyEnabled: boolean

  followUpEnabled: boolean
  sendDelayMinutes: string
  sendDelayMinutesError: string | undefined
  followUpDelayMinutes: string
  followUpDelayMinutesError: string | undefined
  escalationDelayMinutes: string
  escalationDelayMinutesError: string | undefined
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  quietHoursError: string | undefined
  timezone: AutomationTimezone
  timezoneOptions: ReadonlyArray<SettingsSelectOption<AutomationTimezone>>
  escalationReviewDescription: string

  isSaving: boolean
  errorBanner: string | null
  successBanner: string | null

  activePlanName: string | null
  billingPlanId: OnboardingBillingPlanId | null
  billingStatusLabel: string
  billingPlansById: Partial<
    Record<OnboardingBillingPlanId, OnboardingBillingPlanConfig>
  >
  selectedPlanId: OnboardingBillingPlanId | null
  planOptions: ReadonlyArray<SettingsPlanOption>
  isChangingPlan: boolean
  isFreePlanClaimed: boolean
  usageData: SettingsUsageData | null
  templateLanguages: ReadonlyArray<'ar' | 'en'>
  defaultTemplateLanguage: 'ar' | 'en'
  templatePreviews: Record<'ar' | 'en', SettingsTemplatePreview>

  onStoreNameChange: (value: string) => void
  onDefaultLanguageChange: (value: IntegrationOnboardingLanguage) => void
  onShippingCurrencyChange: (value: string) => void
  onAvgShippingCostChange: (value: string) => void
  onAutoVerifyChange: (checked: boolean) => void
  onFollowUpEnabledChange: (checked: boolean) => void
  onSendDelayMinutesChange: (value: string) => void
  onFollowUpDelayMinutesChange: (value: string) => void
  onEscalationDelayMinutesChange: (value: string) => void
  onQuietHoursEnabledChange: (checked: boolean) => void
  onQuietHoursStartChange: (value: string) => void
  onQuietHoursEndChange: (value: string) => void
  onTimezoneChange: (value: AutomationTimezone) => void
  onSave: () => Promise<void>
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onChangePlan: () => Promise<void>
}
