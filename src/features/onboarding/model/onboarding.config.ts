/**
 * Onboarding v2 has two visible steps (quick setup, test message) and a
 * success screen that closes them. There is no plan step: Starter is granted
 * when setup is saved, and plans are offered later from the dashboard.
 */
export type EmbeddedStep = 'setup' | 'test' | 'success'

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
