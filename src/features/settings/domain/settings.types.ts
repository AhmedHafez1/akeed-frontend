import type {
  ArabicCodTemplateVariantId,
  AutomationTimezone,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { CodTemplateDefinition } from '../api/settingsApi'

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
  sourcePlatformType: string
  sourceIdentity: string
  canUpdateConfiguration: boolean
  isLoadError: boolean
  storeName: string
  storeNameError: string | undefined
  defaultLanguage: IntegrationOnboardingLanguage
  languageOptions: ReadonlyArray<
    SettingsSelectOption<IntegrationOnboardingLanguage>
  >
  isAutoVerifyEnabled: boolean
  assumeCodWhenPaymentMissing: boolean

  followUpEnabled: boolean
  sendDelayMinutes: string
  sendDelayMinutesError: string | undefined
  followUpDelayMinutes: string
  followUpDelayMinutesError: string | undefined
  escalationEnabled: boolean
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
  isDirty: boolean
  saveFailed: boolean
  errorBanner: string | null
  successBanner: string | null

  activePlanName: string | null
  billingPlanId: OnboardingBillingPlanId | null
  billingStatusLabel: string
  canManageBilling: boolean
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
  codTemplateDefaults: {
    ar: ArabicCodTemplateVariantId
    en: EnglishCodTemplateVariantId
  }
  selectedCodTemplateVariants: {
    ar: ArabicCodTemplateVariantId
    en: EnglishCodTemplateVariantId
  }
  codTemplateVariants: {
    ar: CodTemplateDefinition[]
    en: CodTemplateDefinition[]
  }
  templatePreviews: Record<'ar' | 'en', SettingsTemplatePreview>

  onStoreNameChange: (value: string) => void
  onDefaultLanguageChange: (value: IntegrationOnboardingLanguage) => void
  onAutoVerifyChange: (checked: boolean) => void
  onAssumeCodWhenPaymentMissingChange: (checked: boolean) => void
  onFollowUpEnabledChange: (checked: boolean) => void
  onSendDelayMinutesChange: (value: string) => void
  onFollowUpDelayMinutesChange: (value: string) => void
  onEscalationEnabledChange: (checked: boolean) => void
  onEscalationDelayMinutesChange: (value: string) => void
  onQuietHoursEnabledChange: (checked: boolean) => void
  onQuietHoursStartChange: (value: string) => void
  onQuietHoursEndChange: (value: string) => void
  onTimezoneChange: (value: AutomationTimezone) => void
  onCodTemplateArVariantChange: (value: ArabicCodTemplateVariantId) => void
  onCodTemplateEnVariantChange: (value: EnglishCodTemplateVariantId) => void
  onSave: () => Promise<void>
  onDiscard: () => void
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onChangePlan: () => Promise<void>
  onRetry: () => void
}
