'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import {
  checkEmbeddedInstall,
  clearEmbeddedAuthCaches,
  fetchOnboardingStatusWithRetry,
  getCachedInstallStatus,
  getCachedOnboardingStatus,
  performTokenExchange,
  resolveOnboardingRedirect,
  setCachedInstallStatus,
  setCachedOnboardingStatus,
  type EmbeddedOnboardingGate,
} from '@/features/onboarding'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')
  const search = useMemo(() => {
    const query = searchParams.toString()
    return query ? `?${query}` : ''
  }, [searchParams])

  // Initialise as ready when caches are warm — avoids skeleton flash on
  // subsequent navigations within the same embedded session.
  const [isEmbeddedReady, setIsEmbeddedReady] = useState(() => {
    if (!isEmbedded || !shopDomain) return false
    return canSatisfyFromCache(shopDomain, onboardingGate)
  })

  // Show native Shopify top-bar progress while auth gate is checking
  useAppBridgeLoading(isEmbedded && !isEmbeddedReady)

  useEffect(() => {
    if (isLoading) return

    if (!isEmbedded || !shopDomain) return
    if (onboardingGate !== 'none' && !shopify) return

    let active = true

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
      if (!active) return

      // Determine whether we already have a cached install confirmation.
      // When the cache is warm we skip the loading state entirely so the
      // page content stays visible while we re-validate in the background.
      const hasWarmInstallCache = getCachedInstallStatus(shopDomain) === true

      if (!hasWarmInstallCache) {
        setIsEmbeddedReady(false)
      }

      try {
        let isInstalled = hasWarmInstallCache

        // Skip the expensive token exchange & install check when cache
        // already confirms the app is installed for this shop.
        if (!isInstalled) {
          // -- Primary: Token Exchange (App Bridge v4)
          // If the Shopify global is available we can attempt a seamless
          // token exchange. This both verifies install status AND performs
          // first-install without a full-page redirect out of the iframe.
          if (shopify) {
            try {
              const sessionToken = await shopify.idToken()
              if (sessionToken) {
                isInstalled = await performTokenExchange(sessionToken)
              }
            } catch (exchangeError) {
              console.warn(
                '[EmbeddedAuthGate] Token exchange failed, falling back to legacy flow:',
                exchangeError
              )
            }
          }

          // -- Fallback: Legacy install check + OAuth redirect
          if (!isInstalled) {
            isInstalled = await checkEmbeddedInstall(shopDomain)
          }

          if (!isInstalled) {
            redirectToAuth()
            return
          }

          // Persist successful install confirmation
          setCachedInstallStatus(shopDomain, true)
        }

        if (onboardingGate !== 'none') {
          // Try cache first — only 'completed' is cached so 'pending'
          // always triggers a fresh fetch (avoids stale-redirect loops).
          let onboardingStatus = getCachedOnboardingStatus()

          if (!onboardingStatus) {
            onboardingStatus = await fetchOnboardingStatusWithRetry()
            if (!active) return
            setCachedOnboardingStatus(onboardingStatus)
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
              router.replace(destinationRoute)
              return
            }
          }
        }

        if (active) {
          setIsEmbeddedReady(true)
        }
      } catch (error) {
        console.error('[EmbeddedAuthGate] Failed embedded auth checks:', error)
        if (active) {
          clearEmbeddedAuthCaches()
          setIsEmbeddedReady(false)
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
    search,
    shopDomain,
  ])

  if (isLoading) return fallback
  if (!isEmbedded) return children
  if (!isEmbeddedReady) return fallback

  return children
}
