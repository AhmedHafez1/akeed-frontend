import type { OnboardingBillingPlanId } from '@/types/embedded-onboarding.model'

export const TOTAL_STEPS = 3

export type EmbeddedStep = 1 | 2 | 3

type OnboardingMessageKey =
  | 'languageAuto'
  | 'languageEnglish'
  | 'languageArabic'
  | 'planStarterName'
  | 'planStarterPrice'
  | 'planStarterVolume'
  | 'planGrowthName'
  | 'planGrowthPrice'
  | 'planGrowthVolume'
  | 'planProName'
  | 'planProPrice'
  | 'planProVolume'
  | 'planScaleName'
  | 'planScalePrice'
  | 'planScaleVolume'

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

export const BILLING_PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'starter',
    nameKey: 'planStarterName',
    priceKey: 'planStarterPrice',
    volumeKey: 'planStarterVolume',
  },
  {
    id: 'growth',
    nameKey: 'planGrowthName',
    priceKey: 'planGrowthPrice',
    volumeKey: 'planGrowthVolume',
  },
  {
    id: 'pro',
    nameKey: 'planProName',
    priceKey: 'planProPrice',
    volumeKey: 'planProVolume',
  },
  {
    id: 'scale',
    nameKey: 'planScaleName',
    priceKey: 'planScalePrice',
    volumeKey: 'planScaleVolume',
  },
]
