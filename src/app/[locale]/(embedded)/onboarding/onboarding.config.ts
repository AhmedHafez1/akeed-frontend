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
  | 'planStarterFeature1'
  | 'planStarterFeature2'
  | 'planGrowthName'
  | 'planGrowthPrice'
  | 'planGrowthVolume'
  | 'planGrowthFeature1'
  | 'planGrowthFeature2'
  | 'planGrowthBadge'
  | 'planProName'
  | 'planProPrice'
  | 'planProVolume'
  | 'planProFeature1'
  | 'planProFeature2'
  | 'planScaleName'
  | 'planScalePrice'
  | 'planScaleVolume'
  | 'planScaleFeature1'
  | 'planScaleFeature2'
  | 'planScaleBadge'

interface PlanDefinition {
  id: OnboardingBillingPlanId
  nameKey: OnboardingMessageKey
  priceKey: OnboardingMessageKey
  volumeKey: OnboardingMessageKey
  featureKeys: [OnboardingMessageKey, OnboardingMessageKey]
  badgeKey?: OnboardingMessageKey
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
    featureKeys: ['planStarterFeature1', 'planStarterFeature2'],
  },
  {
    id: 'growth',
    nameKey: 'planGrowthName',
    priceKey: 'planGrowthPrice',
    volumeKey: 'planGrowthVolume',
    featureKeys: ['planGrowthFeature1', 'planGrowthFeature2'],
    badgeKey: 'planGrowthBadge',
  },
  {
    id: 'pro',
    nameKey: 'planProName',
    priceKey: 'planProPrice',
    volumeKey: 'planProVolume',
    featureKeys: ['planProFeature1', 'planProFeature2'],
  },
  {
    id: 'scale',
    nameKey: 'planScaleName',
    priceKey: 'planScalePrice',
    volumeKey: 'planScaleVolume',
    featureKeys: ['planScaleFeature1', 'planScaleFeature2'],
    badgeKey: 'planScaleBadge',
  },
]

