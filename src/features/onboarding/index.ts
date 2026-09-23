export { useEmbeddedOnboarding } from './hooks/useEmbeddedOnboarding'
export type { OnboardingTestError } from './hooks/useOnboardingTest'

export {
  LANGUAGE_OPTION_DEFINITIONS,
  ONBOARDING_FLOW_STEPS,
  TOTAL_STEPS,
} from './model/onboarding.config'
export type { EmbeddedStep } from './model/onboarding.config'
export { buildTestTimeline } from './model/onboardingTest'

export {
  STANDALONE_FIELD_IDS,
  STANDALONE_FIELD_ORDER,
  STANDALONE_FIELD_STEP,
  STANDALONE_STEPS,
  STANDALONE_TOTAL_STEPS,
  getStepDefinition,
} from './model/onboarding.steps'

export { OnboardingAlerts } from './ui/embedded/components/OnboardingAlerts'
export { OnboardingStepCounter } from './ui/embedded/components/OnboardingStepCounter'
export { QuickSetupStep } from './ui/embedded/steps/QuickSetupStep'
export { TestMessageStep } from './ui/embedded/steps/TestMessageStep'
export { SetupSuccessStep } from './ui/embedded/steps/SetupSuccessStep'

export {
  createOnboardingBilling,
  completeStandaloneOnboarding,
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
  isFreePlanAlreadyClaimedError,
  updateOnboardingSettings,
} from './api/onboardingApi'
export { OnboardingApiError } from './api/onboardingApi'
export { StandaloneOnboardingPage } from './ui/standalone/StandaloneOnboardingPage'

export {
  checkEmbeddedInstall,
  clearEmbeddedAuthCaches,
  fetchOnboardingStatusWithRetry,
  getCachedInstallStatus,
  getCachedOnboardingStatus,
  performTokenExchange,
  resolveOnboardingRedirect,
  setCachedInstallStatus,
  setCachedOnboardingStatus,
} from './lib/embeddedAuth'
export type { EmbeddedOnboardingGate } from './lib/embeddedAuth'

export { ONBOARDING_BILLING_PLAN_IDS } from './domain/onboarding.types'

export type {
  ArabicCodTemplateVariantId,
  AutomationTimezone,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
  OnboardingActivation,
  OnboardingBillingPlan,
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
  OnboardingSettingsPayload,
  StandaloneSetupBlockedReason,
  StandaloneSetupFieldErrors,
  StandaloneSetupFieldKey,
  StandaloneStep,
  StandaloneStepDefinition,
} from './domain/onboarding.types'
