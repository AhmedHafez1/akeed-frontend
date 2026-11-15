'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { useDelayedBoolean } from '@/shared/hooks/useDelayedBoolean'
import {
  clearEmbeddedAuthCaches,
  ensureEmbeddedInstall,
  fetchEmbeddedOnboardingState,
  getEmbeddedAuthScope,
  isCurrentEmbeddedAuthScope,
  getCachedInstallStatus,
  getCachedOnboardingStatus,
  resolveOnboardingRedirect,
  type EmbeddedOnboardingGate,
} from '@/features/onboarding'
import { createLogger } from '@/shared/lib/logger'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { queryKeys } from '@/shared/query/keys'
import { startStartupStage } from '@/shared/lib/startup-performance'

const logger = createLogger('EmbeddedAuthGate')
const queryScopes = new WeakMap<
  QueryClient,
  ReturnType<typeof getEmbeddedAuthScope>
>()

interface EmbeddedAuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onboardingGate?: EmbeddedOnboardingGate
}

function buildInstallAuthUrl(
  shopDomain: string,
  hostParam: string | null
): URL {
  const authUrl = new URL('/api/auth/shopify', window.location.origin)
  authUrl.searchParams.set('shop', shopDomain)
  if (hostParam) {
    authUrl.searchParams.set('host', hostParam)
  }
  return authUrl
}

/**
 * Check whether module-level caches can fully satisfy the auth gate for
 * the current page without any network requests. Used to initialise the
 * ready state so that content renders instantly on subsequent navigations.
 */
function canSatisfyFromCache(
  shopDomain: string | null,
  onboardingGate: EmbeddedOnboardingGate
): boolean {
  if (!shopDomain) return false
  if (getCachedInstallStatus(shopDomain) !== true) return false
  if (onboardingGate === 'none') return true

  const cachedOnboarding = getCachedOnboardingStatus()
  if (!cachedOnboarding) return false

  const redirect = resolveOnboardingRedirect({
    onboardingGate,
    onboardingStatus: cachedOnboarding,
  })
  return redirect === null
}

export function EmbeddedAuthGate({
  children,
  fallback = null,
  onboardingGate = 'none',
}: EmbeddedAuthGateProps) {
  const { isEmbedded, shopDomain, hostParam, shopify, isLoading } =
    useAkeedMode()
  const router = useRouter()
  const queryClient = useQueryClient()
  const scope = getEmbeddedAuthScope()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')
  const search = useMemo(() => {
    const query = searchParams.toString()
    return query ? `?${query}` : ''
  }, [searchParams])

  // Initialise as ready when caches are warm — avoids skeleton flash on
  // subsequent navigations within the same embedded session.
  const [ready, setReady] = useState(() =>
    isEmbedded && canSatisfyFromCache(shopDomain, onboardingGate)
      ? { scope, onboardingGate }
      : null
  )
  const isEmbeddedReady =
    ready?.scope === scope && ready.onboardingGate === onboardingGate

  // Show native Shopify top-bar progress while auth gate is checking
  useAppBridgeLoading(isEmbedded && !isEmbeddedReady)
  const shouldShowGateFallback = isLoading || (isEmbedded && !isEmbeddedReady)
  const showGateFallback = useDelayedBoolean(shouldShowGateFallback)

  useEffect(() => {
    if (isLoading) return

    if (!isEmbedded || !shopDomain) return
    if (onboardingGate !== 'none' && !shopify) return
    const scope = getEmbeddedAuthScope()
    if (scope.key !== JSON.stringify([shopDomain, hostParam])) return

    if (queryScopes.get(queryClient) !== scope) {
      // Query keys are shared; a different embedded identity must start empty.
      queryClient.clear()
      queryScopes.set(queryClient, scope)
    }

    let active = true
    const finish = startStartupStage('auth-gate')
    const isCurrent = () => active && isCurrentEmbeddedAuthScope(scope)

    const redirectToAuth = () => {
      const authUrl = buildInstallAuthUrl(shopDomain, hostParam)

      // In App Bridge v4, use open() to navigate out of the iframe
      // for full-page redirects (e.g. OAuth install flow).
      // Fallback to window.open for top-level navigation.
      if (window.top && window.top !== window.self) {
        window.open(authUrl.toString(), '_top')
      } else {
        window.location.href = authUrl.toString()
      }
    }

    const runChecks = async () => {
      if (!isCurrent()) return

      // Determine whether we already have a cached install confirmation.
      // When the cache is warm we skip the loading state entirely so the
      // page content stays visible while we re-validate in the background.
      const hasWarmInstallCache = getCachedInstallStatus(shopDomain) === true

      if (!hasWarmInstallCache) {
        setReady(null)
      }

      try {
        const isInstalled = await ensureEmbeddedInstall(shopDomain, shopify)
        if (!isCurrent()) return
        if (!isInstalled) {
          finish(false)
          redirectToAuth()
          return
        }

        if (onboardingGate !== 'none') {
          // Try cache first — only 'completed' is cached so 'pending'
          // always triggers a fresh fetch (avoids stale-redirect loops).
          let onboardingStatus = getCachedOnboardingStatus()

          if (!onboardingStatus) {
            const response = await fetchEmbeddedOnboardingState()
            if (!isCurrent()) return
            onboardingStatus = response.state.onboardingStatus
            // Keep the full envelope: activation reads this exact query key.
            queryClient.setQueryData(queryKeys.onboarding.state(), response)
          }

          const redirectDestination = resolveOnboardingRedirect({
            onboardingGate,
            onboardingStatus,
          })

          if (redirectDestination) {
            const destinationPath = withLocale(
              `/${redirectDestination}`,
              locale
            )
            const destinationRoute = `${destinationPath}${search}`
            const currentRoute = `${pathname ?? ''}${search}`

            if (destinationRoute !== currentRoute) {
              finish()
              router.replace(destinationRoute)
              return
            }
          }
        }

        if (isCurrent()) {
          finish()
          setReady({ scope, onboardingGate })
        }
      } catch (error) {
        if (!isCurrent()) return
        finish(false)
        logger.error('Failed embedded auth checks', error, {
          shopDomain,
          onboardingGate,
        })
        if (isCurrent()) {
          clearEmbeddedAuthCaches()
          setReady(null)
        }
      }
    }

    void runChecks()

    return () => {
      active = false
    }
  }, [
    shopify,
    hostParam,
    isEmbedded,
    isLoading,
    locale,
    onboardingGate,
    pathname,
    router,
    queryClient,
    search,
    shopDomain,
  ])

  if (isLoading) return showGateFallback ? fallback : null
  if (!isEmbedded) return children
  if (!isEmbeddedReady) return showGateFallback ? fallback : null

  return children
}
