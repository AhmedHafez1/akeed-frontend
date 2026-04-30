import type { OnboardingBillingPlanId } from '@/features/onboarding/domain/onboarding.types'
import type { SupportedLocale } from '@/shared/lib/locale'

export const TOTAL_STEPS = 3

export type EmbeddedStep = 1 | 2 | 3

type OnboardingMessageKey =
  | 'languageAuto'
  | 'languageEnglish'
  | 'languageArabic'
  | 'planStarterName'
  | 'planStarterPrice'
  | 'planStarterVolume'
  | 'planBasicName'
  | 'planBasicPrice'
  | 'planBasicVolume'
  | 'planProName'
  | 'planProPrice'
  | 'planProVolume'
  | 'planBusinessName'
  | 'planBusinessPrice'
  | 'planBusinessVolume'

interface PlanDefinition {
  id: OnboardingBillingPlanId
  nameKey: OnboardingMessageKey
  priceKey: OnboardingMessageKey
  volumeKey: OnboardingMessageKey
}

export const LANGUAGE_OPTION_DEFINITIONS = [
  { labelKey: 'languageAuto', value: 'auto' },
  { labelKey: 'languageEnglish', value: 'en' },
  { labelKey: 'languageArabic', value: 'ar' },
] as const satisfies ReadonlyArray<{
  labelKey: OnboardingMessageKey
  value: 'auto' | 'en' | 'ar'
}>

export const APP_LANGUAGE_OPTION_DEFINITIONS = [
  { labelKey: 'languageEnglish', value: 'en' },
  { labelKey: 'languageArabic', value: 'ar' },
] as const satisfies ReadonlyArray<{
  labelKey: OnboardingMessageKey
  value: SupportedLocale
}>

export const BILLING_PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'starter',
    nameKey: 'planStarterName',
    priceKey: 'planStarterPrice',
    volumeKey: 'planStarterVolume',
  },
  {
    id: 'basic',
    nameKey: 'planBasicName',
    priceKey: 'planBasicPrice',
    volumeKey: 'planBasicVolume',
  },
  {
    id: 'pro',
    nameKey: 'planProName',
    priceKey: 'planProPrice',
    volumeKey: 'planProVolume',
  },
  {
    id: 'business',
    nameKey: 'planBusinessName',
    priceKey: 'planBusinessPrice',
    volumeKey: 'planBusinessVolume',
  },
]
