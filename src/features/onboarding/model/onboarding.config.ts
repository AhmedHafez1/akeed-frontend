/**
 * Onboarding v2 has two visible steps (quick setup, test message) and a
 * success screen that closes them. A planless Shopify reinstall instead sees
 * a plan picker after setup; eligible stores still receive Starter silently.
 */
export type EmbeddedStep = 'setup' | 'plans' | 'test' | 'success'

export const ONBOARDING_FLOW_STEPS = ['setup', 'test'] as const

export const TOTAL_STEPS = ONBOARDING_FLOW_STEPS.length

/** How often the test step re-reads delivery status while it waits. */
export const ONBOARDING_TEST_POLL_INTERVAL_MS = 2500

type OnboardingMessageKey =
  | 'languageAuto'
  | 'languageEnglish'
  | 'languageArabic'

export const LANGUAGE_OPTION_DEFINITIONS = [
  { labelKey: 'languageAuto', value: 'auto' },
  { labelKey: 'languageEnglish', value: 'en' },
  { labelKey: 'languageArabic', value: 'ar' },
] as const satisfies ReadonlyArray<{
  labelKey: OnboardingMessageKey
  value: 'auto' | 'en' | 'ar'
}>
