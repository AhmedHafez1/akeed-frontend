import type { IntegrationOnboardingStatus } from '@/types/embedded-onboarding.model'

export type EmbeddedDestination = 'onboarding' | 'dashboard'

const COMPLETED_ONBOARDING_QUERY_VALUE = 'completed'
const COMPLETED_BILLING_STATUSES = ['active', 'not_required'] as const

type CompletedBillingStatus = (typeof COMPLETED_BILLING_STATUSES)[number]

export function isOnboardingCompletedByQuery(params: {
  onboardingParam: string | null
  billingStatusParam: string | null
}): boolean {
  return (
    params.onboardingParam === COMPLETED_ONBOARDING_QUERY_VALUE ||
    isCompletedBillingStatus(params.billingStatusParam)
  )
}

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

function isCompletedBillingStatus(
  value: string | null
): value is CompletedBillingStatus {
  if (value === null) {
    return false
  }

  return COMPLETED_BILLING_STATUSES.includes(value as CompletedBillingStatus)
}

