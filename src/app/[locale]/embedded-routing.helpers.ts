import type { IntegrationOnboardingStatus } from '@/types/embedded-onboarding.model'

export type EmbeddedDestination = 'onboarding' | 'dashboard'

export function resolveEmbeddedDestinationByOnboardingStatus(
  onboardingStatus: IntegrationOnboardingStatus
): EmbeddedDestination {
  return onboardingStatus === 'pending' ? 'onboarding' : 'dashboard'
}

export function buildEmbeddedRoute(params: {
  locale: string
  destination: EmbeddedDestination
  search: string
}): string {
  return `/${params.locale}/${params.destination}${params.search}`
}
