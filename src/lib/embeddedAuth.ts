'use client'

import { fetchOnboardingState } from '@/lib/onboarding'
import type { IntegrationOnboardingStatus } from '@/types/embedded-onboarding.model'

export type EmbeddedOnboardingGate =
  | 'none'
  | 'landing'
  | 'dashboard'
  | 'onboarding'

type EmbeddedDestination = 'dashboard' | 'onboarding'

/**
 * Maps onboarding status to the canonical embedded destination route.
 */
function resolveEmbeddedDestination(
  onboardingStatus: IntegrationOnboardingStatus
): EmbeddedDestination {
  return onboardingStatus === 'pending' ? 'onboarding' : 'dashboard'
}

/**
 * Resolves whether the current page should redirect based on gate mode.
 * Returns the destination route when a redirect is required, otherwise null.
 */
export function resolveOnboardingRedirect(params: {
  onboardingGate: EmbeddedOnboardingGate
  onboardingStatus: IntegrationOnboardingStatus
}): EmbeddedDestination | null {
  const destination = resolveEmbeddedDestination(params.onboardingStatus)

  if (params.onboardingGate === 'landing') {
    return destination
  }

  if (
    params.onboardingGate === 'dashboard' &&
    params.onboardingStatus === 'pending'
  ) {
    return 'onboarding'
  }

  if (
    params.onboardingGate === 'onboarding' &&
    params.onboardingStatus === 'completed'
  ) {
    return 'dashboard'
  }

  return null
}

/**
 * Checks backend install status for the current Shopify shop.
 * Returns true only when the endpoint confirms the app is installed.
 */
export async function checkEmbeddedInstall(
  shopDomain: string
): Promise<boolean> {
  const checkUrl = `/auth/shopify/check?shop=${encodeURIComponent(shopDomain)}`
  const response = await fetch(checkUrl, {
    method: 'GET',
    credentials: 'include',
    headers: {
      accept: 'application/json',
    },
    cache: 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  if (!response.ok || !contentType.includes('application/json')) {
    return false
  }

  const data = (await response.json()) as { installed?: boolean }
  return Boolean(data.installed)
}

/**
 * Identifies onboarding fetch errors that are likely transient and worth retrying.
 */
function isRetryableOnboardingError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase().trim() : ''

  return (
    message.includes('invalid or expired token') ||
    message.includes('invalid shopify session token') ||
    message.includes('missing authorization token')
  )
}

/**
 * Fetches onboarding status with a short bounded retry strategy to handle
 * token/session timing races during embedded app initialization.
 */
export async function fetchOnboardingStatusWithRetry(): Promise<IntegrationOnboardingStatus> {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { state } = await fetchOnboardingState()
      return state.onboardingStatus
    } catch (error) {
      if (attempt === maxAttempts || !isRetryableOnboardingError(error)) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
    }
  }

  throw new Error('Unable to resolve onboarding state')
}
