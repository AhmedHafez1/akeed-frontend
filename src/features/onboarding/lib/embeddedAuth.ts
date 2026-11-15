'use client'

import {
  fetchOnboardingState,
  OnboardingApiError,
} from '@/features/onboarding/api/onboardingApi'
import type {
  IntegrationOnboardingStatus,
  OnboardingStateResponse,
} from '@/features/onboarding/domain/onboarding.types'
import { resolveEmbeddedContextFromWindow } from '@/shared/lib/embedded-context'
import { primeShopifySessionToken } from '@/shared/lib/auth'
import { measureStartup } from '@/shared/lib/startup-performance'
import { createLogger } from '@/shared/lib/logger'
import type { ShopifyGlobal } from '@/shared/types/window.model'

export type EmbeddedOnboardingGate =
  | 'none'
  | 'landing'
  | 'dashboard'
  | 'onboarding'

type EmbeddedDestination = 'dashboard' | 'onboarding'

// ---------------------------------------------------------------------------
// Module-level caches
//
// These caches survive across client-side navigations so that subsequent
// page mounts inside EmbeddedAuthGate can skip expensive network calls
// (token exchange, onboarding state fetch) and render content instantly.
// ---------------------------------------------------------------------------

interface InstallCache {
  shopDomain: string
  installed: boolean
  timestamp: number
}

interface OnboardingCache {
  status: IntegrationOnboardingStatus
  timestamp: number
}

let installCache: InstallCache | null = null
let onboardingCache: OnboardingCache | null = null

interface EmbeddedAuthScope {
  readonly key: string | null
}
const SERVER_SCOPE: EmbeddedAuthScope = { key: null }
let scope: EmbeddedAuthScope = SERVER_SCOPE
let installRequest: Promise<boolean> | null = null
let onboardingRequest: Promise<OnboardingStateResponse> | null = null
const logger = createLogger('EmbeddedAuth')

export function getEmbeddedAuthScope(): EmbeddedAuthScope {
  if (typeof window === 'undefined') return SERVER_SCOPE
  const context = resolveEmbeddedContextFromWindow(false)
  const key = context.isEmbedded
    ? JSON.stringify([context.shopDomain, context.hostParam])
    : null
  if (scope.key !== key) {
    clearEmbeddedAuthCaches()
    scope = { key }
  }
  return scope
}

export function isCurrentEmbeddedAuthScope(
  expected: EmbeddedAuthScope
): boolean {
  return expected === getEmbeddedAuthScope()
}

function assertScope(expected: EmbeddedAuthScope) {
  if (!isCurrentEmbeddedAuthScope(expected)) {
    throw new DOMException('Embedded context changed.', 'AbortError')
  }
}

/** Install status is stable — cache for 5 minutes. */
const INSTALL_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Onboarding 'completed' status is permanent — cache for 5 minutes.
 * 'pending' is never cached to avoid redirect loops after the user
 * completes onboarding.
 */
const ONBOARDING_CACHE_TTL_MS = 5 * 60 * 1000

export function getCachedInstallStatus(shopDomain: string): boolean | null {
  getEmbeddedAuthScope()
  if (
    installCache &&
    installCache.shopDomain === shopDomain &&
    Date.now() - installCache.timestamp < INSTALL_CACHE_TTL_MS
  ) {
    return installCache.installed
  }
  return null
}

export function setCachedInstallStatus(
  shopDomain: string,
  installed: boolean
): void {
  getEmbeddedAuthScope()
  installCache = { shopDomain, installed, timestamp: Date.now() }
}

export function getCachedOnboardingStatus(): IntegrationOnboardingStatus | null {
  getEmbeddedAuthScope()
  if (
    onboardingCache &&
    onboardingCache.status === 'completed' &&
    Date.now() - onboardingCache.timestamp < ONBOARDING_CACHE_TTL_MS
  ) {
    return onboardingCache.status
  }
  return null
}

export function setCachedOnboardingStatus(
  status: IntegrationOnboardingStatus
): void {
  getEmbeddedAuthScope()
  if (status === 'completed') {
    onboardingCache = { status, timestamp: Date.now() }
  }
}

export function clearEmbeddedAuthCaches(): void {
  scope = { key: scope.key }
  installRequest = null
  onboardingRequest = null
  installCache = null
  onboardingCache = null
}

/** Share only in-flight work; successful installation keeps the existing TTL. */
export function ensureEmbeddedInstall(
  shopDomain: string,
  shopify: ShopifyGlobal | null
): Promise<boolean> {
  const expected = getEmbeddedAuthScope()
  if (
    !expected.key ||
    resolveEmbeddedContextFromWindow(false).shopDomain !== shopDomain
  )
    return Promise.reject(
      new DOMException('Missing embedded context.', 'AbortError')
    )
  if (getCachedInstallStatus(shopDomain) === true) return Promise.resolve(true)
  if (installRequest) return installRequest
  const request = (async () => {
    let installed = false
    if (shopify) {
      try {
        const token = await measureStartup('session-token', () =>
          shopify.idToken()
        )
        assertScope(expected)
        if (token) {
          primeShopifySessionToken(token)
          installed = await measureStartup(
            'token-exchange',
            () => performTokenExchange(token),
            Boolean
          )
          assertScope(expected)
        }
      } catch (error) {
        assertScope(expected)
        logger.warn('Token exchange failed, falling back to install check', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
      }
    }
    if (!installed) {
      installed = await measureStartup(
        'install-check',
        () => checkEmbeddedInstall(shopDomain),
        Boolean
      )
      assertScope(expected)
    }
    if (installed) setCachedInstallStatus(shopDomain, true)
    return installed
  })()
  installRequest = request
  // Attach cleanup to both outcomes without creating an unhandled rejected promise.
  const cleanup = () => {
    if (installRequest === request) installRequest = null
  }
  void request.then(cleanup, cleanup)
  return request
}

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
 * Exchange a Shopify session token for an offline access token.
 *
 * This is the primary install path for embedded apps running App Bridge v4.
 * It both checks install status AND performs first-install without
 * redirecting out of the iframe.
 *
 * @returns `true` when the shop is installed (or was just installed).
 *          `false` when the exchange failed (caller should fall back to the
 *          install check).
 */
export async function performTokenExchange(
  sessionToken: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/shopify/token-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ sessionToken }),
      cache: 'no-store',
    })

    if (!response.ok) return false

    const data = (await response.json()) as { installed?: boolean }
    return Boolean(data.installed)
  } catch {
    return false
  }
}

/**
 * Checks backend install status for the current Shopify shop.
 * Returns true only when the endpoint confirms the app is installed.
 */
export async function checkEmbeddedInstall(
  shopDomain: string
): Promise<boolean> {
  const checkUrl = `/api/auth/shopify/check?shop=${encodeURIComponent(shopDomain)}`
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
  // 5xx here is usually the dev proxy failing while the backend restarts.
  if (error instanceof OnboardingApiError && error.status >= 500) {
    return true
  }

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
async function fetchOnboardingStateWithRetry(
  expected: EmbeddedAuthScope
): Promise<OnboardingStateResponse> {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    assertScope(expected)
    try {
      const response = await measureStartup('onboarding-request', () =>
        fetchOnboardingState()
      )
      assertScope(expected)
      return response
    } catch (error) {
      assertScope(expected)
      if (attempt === maxAttempts || !isRetryableOnboardingError(error)) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
    }
  }

  throw new Error('Unable to resolve onboarding state')
}

export function fetchEmbeddedOnboardingState(): Promise<OnboardingStateResponse> {
  const expected = getEmbeddedAuthScope()
  if (!expected.key)
    return Promise.reject(
      new DOMException('Missing embedded context.', 'AbortError')
    )
  if (onboardingRequest) return onboardingRequest
  const request = fetchOnboardingStateWithRetry(expected).then((response) => {
    assertScope(expected)
    setCachedOnboardingStatus(response.state.onboardingStatus)
    return response
  })
  onboardingRequest = request
  const cleanup = () => {
    if (onboardingRequest === request) onboardingRequest = null
  }
  void request.then(cleanup, cleanup)
  return request
}
