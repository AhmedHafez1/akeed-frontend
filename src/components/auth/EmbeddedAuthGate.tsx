'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import {
  checkEmbeddedInstall,
  fetchOnboardingStatusWithRetry,
  resolveOnboardingRedirect,
  type EmbeddedOnboardingGate,
} from '@/lib/embeddedAuth'
import { getLocaleFromPathname, withLocale } from '@/lib/locale'

interface EmbeddedAuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onboardingGate?: EmbeddedOnboardingGate
}

function buildInstallAuthUrl(
  shopDomain: string,
  hostParam: string | null
): URL {
  const authUrl = new URL('/auth/shopify', window.location.origin)
  authUrl.searchParams.set('shop', shopDomain)
  if (hostParam) {
    authUrl.searchParams.set('host', hostParam)
  }
  return authUrl
}

export function EmbeddedAuthGate({
  children,
  fallback = null,
  onboardingGate = 'none',
}: EmbeddedAuthGateProps) {
  const { isEmbedded, shopDomain, hostParam, appBridge, isLoading } =
    useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')
  const search = useMemo(() => {
    const query = searchParams.toString()
    return query ? `?${query}` : ''
  }, [searchParams])
  const [isEmbeddedReady, setIsEmbeddedReady] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isEmbedded || !shopDomain) return
    if (onboardingGate !== 'none' && !appBridge) return

    let active = true

    const redirectToAuth = () => {
      const authUrl = buildInstallAuthUrl(shopDomain, hostParam)

      if (appBridge) {
        const redirect = Redirect.create(appBridge)
        redirect.dispatch(Redirect.Action.REMOTE, authUrl.toString())
        return
      }

      window.location.href = authUrl.toString()
    }

    const runChecks = async () => {
      if (!active) return

      setIsEmbeddedReady(false)

      try {
        const isInstalled = await checkEmbeddedInstall(shopDomain)
        if (!isInstalled) {
          redirectToAuth()
          return
        }

        if (onboardingGate !== 'none') {
          const onboardingStatus = await fetchOnboardingStatusWithRetry()
          if (!active) return

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
          setIsEmbeddedReady(false)
        }
      }
    }

    void runChecks()

    return () => {
      active = false
    }
  }, [
    appBridge,
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
