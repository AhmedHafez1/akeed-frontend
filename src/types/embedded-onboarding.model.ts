export type IntegrationOnboardingLanguage = 'auto' | 'en' | 'ar'

export type IntegrationOnboardingStatus = 'pending' | 'completed'

export interface IntegrationOnboardingState {
  integrationId: string
  onboardingStatus: IntegrationOnboardingStatus
  isOnboardingComplete: boolean
  storeName: string | null
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
}

export interface OnboardingStateResponse {
  state: IntegrationOnboardingState
}

export interface OnboardingSettingsPayload {
  storeName: string
  defaultLanguage: IntegrationOnboardingLanguage
  isAutoVerifyEnabled: boolean
}

export interface OnboardingBillingResponse {
  confirmationUrl: string
}
