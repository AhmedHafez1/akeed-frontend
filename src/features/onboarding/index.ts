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
  STANDALONE_STEP_NUMBER,
  STANDALONE_TOTAL_STEPS,
  countryFromLanguages,
  countryFromPhone,
  parseStandaloneStep,
} from './model/standaloneStore'

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
  sendOnboardingTest,
  updateOnboardingSettings,
} from './api/onboardingApi'
export {
  OnboardingApiError,
  clearKnownOnboardingSource,
  rememberSignupSource,
} from './api/onboardingApi'
export { useOnboardingSourceSkin } from './hooks/useOnboardingSourceSkin'
export type { OnboardingSourceSkin } from './hooks/useOnboardingSourceSkin'
export { EasyOrdersConnectPage } from './skins/easyorders/EasyOrdersConnectPage'
export { EasyOrdersSourcePanel } from './skins/easyorders/EasyOrdersSourcePanel'
export { WooCommerceConnectPage } from './skins/woocommerce/WooCommerceConnectPage'
export { ONBOARDING_STORE_STEP_TITLE } from './model/onboardingProgress'
export { StandaloneOnboardingPage } from './ui/standalone/StandaloneOnboardingPage'
export { SendTestToPhoneAction } from './ui/standalone/components/SendTestToPhoneAction'

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
  StandaloneStep,
  StandaloneStoreFieldErrors,
  StandaloneStoreFieldKey,
} from './domain/onboarding.types'
