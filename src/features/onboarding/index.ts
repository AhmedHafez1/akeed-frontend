export { useEmbeddedOnboarding } from './hooks/useEmbeddedOnboarding'

export {
  APP_LANGUAGE_OPTION_DEFINITIONS,
  BILLING_PLAN_DEFINITIONS,
  LANGUAGE_OPTION_DEFINITIONS,
  TOTAL_STEPS,
} from './model/onboarding.config'
export type { EmbeddedStep } from './model/onboarding.config'

export { OnboardingAlerts } from './ui/embedded/components/OnboardingAlerts'
export { OnboardingStepCounter } from './ui/embedded/components/OnboardingStepCounter'
export { BillingStep } from './ui/embedded/steps/BillingStep'
export { ConfigurationStep } from './ui/embedded/steps/ConfigurationStep'
export { WelcomeStep } from './ui/embedded/steps/WelcomeStep'

export {
  createOnboardingBilling,
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  updateOnboardingSettings,
} from './api/onboardingApi'

export {
  checkEmbeddedInstall,
  fetchOnboardingStatusWithRetry,
  performTokenExchange,
  resolveOnboardingRedirect,
} from './lib/embeddedAuth'
export type { EmbeddedOnboardingGate } from './lib/embeddedAuth'

export type {
  IntegrationOnboardingLanguage,
  OnboardingBillingPlan,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from './domain/onboarding.types'
