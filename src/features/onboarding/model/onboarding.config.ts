import type { OnboardingBillingPlanId } from '@/features/onboarding/domain/onboarding.types'
import type { SupportedLocale } from '@/shared/lib/locale'

export const TOTAL_STEPS = 2

export type EmbeddedStep = 1 | 2

type OnboardingMessageKey =
  | 'languageAuto'
  | 'languageEnglish'
  | 'languageArabic'
  | 'planStarterName'
  | 'planStarterPrice'
  | 'planStarterVolume'
  | 'planStarterSubtitle'
  | 'planStarterCta'
  | 'planBasicName'
  | 'planBasicPrice'
  | 'planBasicVolume'
  | 'planBasicSubtitle'
  | 'planBasicCta'
  | 'planProName'
  | 'planProPrice'
  | 'planProVolume'
  | 'planProSubtitle'
  | 'planProCta'
  | 'planBusinessName'
  | 'planBusinessPrice'
  | 'planBusinessVolume'
  | 'planBusinessSubtitle'
  | 'planBusinessCta'

interface PlanDefinition {
  id: OnboardingBillingPlanId
  nameKey: OnboardingMessageKey
  priceKey: OnboardingMessageKey
  volumeKey: OnboardingMessageKey
  subtitleKey: OnboardingMessageKey
  ctaKey: OnboardingMessageKey
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
    subtitleKey: 'planStarterSubtitle',
    ctaKey: 'planStarterCta',
  },
  {
    id: 'basic',
    nameKey: 'planBasicName',
    priceKey: 'planBasicPrice',
    volumeKey: 'planBasicVolume',
    subtitleKey: 'planBasicSubtitle',
    ctaKey: 'planBasicCta',
  },
  {
    id: 'pro',
    nameKey: 'planProName',
    priceKey: 'planProPrice',
    volumeKey: 'planProVolume',
    subtitleKey: 'planProSubtitle',
    ctaKey: 'planProCta',
  },
  {
    id: 'business',
    nameKey: 'planBusinessName',
    priceKey: 'planBusinessPrice',
    volumeKey: 'planBusinessVolume',
    subtitleKey: 'planBusinessSubtitle',
    ctaKey: 'planBusinessCta',
  },
]
