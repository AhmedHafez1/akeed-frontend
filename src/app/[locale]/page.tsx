'use client'

/**
 * Root Page - Mode-aware landing.
 *
 * - Embedded: sends merchants to onboarding (if pending) or dashboard.
 * - Standalone: renders the marketing homepage.
 */

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/lib/locale'
import { fetchOnboardingState } from '@/lib/onboarding'
import { HomePage } from '@/components/pages/HomePage'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { EmbeddedAuthGate } from '@/components/auth/EmbeddedAuthGate'
import {
  buildEmbeddedRoute,
  isOnboardingCompletedByQuery,
  resolveEmbeddedDestinationByOnboardingStatus,
} from './embedded-routing.helpers'

export default function Home() {
  const { isEmbedded, isLoading, appBridge } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')
  const onboardingParam = searchParams.get('onboarding')
  const billingStatusParam = searchParams.get('billing_status')

  useEffect(() => {
    if (isLoading || !isEmbedded) return

    let active = true

    const handleEmbeddedLanding = async () => {
      if (!active) return
      const search = window.location.search

      // Billing callback already confirmed onboarding; avoid extra roundtrip.
      if (
        isOnboardingCompletedByQuery({
          onboardingParam,
          billingStatusParam,
        })
      ) {
        router.replace(
          buildEmbeddedRoute({
            locale,
            destination: 'dashboard',
            search,
          })
        )
        return
      }

      if (!appBridge) {
        router.replace(
          buildEmbeddedRoute({
            locale,
            destination: 'dashboard',
            search,
          })
        )
        return
      }

      try {
        const { state } = await fetchOnboardingState()
        if (!active) return

        const destination = resolveEmbeddedDestinationByOnboardingStatus(
          state.onboardingStatus
        )
        router.replace(
          buildEmbeddedRoute({
            locale,
            destination,
            search,
          })
        )
      } catch (error) {
        console.error('[Home] Failed to resolve onboarding state:', error)
        if (active) {
          router.replace(
            buildEmbeddedRoute({
              locale,
              destination: 'dashboard',
              search,
            })
          )
        }
      }
    }

    void handleEmbeddedLanding()

    return () => {
      active = false
    }
  }, [
    appBridge,
    billingStatusParam,
    isEmbedded,
    isLoading,
    locale,
    onboardingParam,
    router,
  ])

  if (isLoading || isEmbedded) {
    return <FullPageLoader />
  }

  return (
    <EmbeddedAuthGate fallback={<FullPageLoader />}>
      <HomePage />
    </EmbeddedAuthGate>
  )
}
