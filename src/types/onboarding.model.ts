export type OnboardingStep =
  | 'organization'
  | 'platform'
  | 'whatsapp'
  | 'complete'

export type PlatformId =
  | 'shopify'
  | 'salla'
  | 'zid'
  | 'woocommerce'
  | 'whatsapp'

export interface PlatformOption {
  id: PlatformId
  name: string
  icon: string
}

export interface OnboardingFormData {
  orgName: string
  orgSlug: string
  selectedPlatforms: PlatformId[]
  whatsappPhoneId: string
  whatsappBusinessId: string
  whatsappAccessToken: string
}

export interface OnboardingStepMeta {
  id: Exclude<OnboardingStep, 'complete'>
  label: string
}
