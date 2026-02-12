'use client'

/**
 * Root Page - Mode-aware landing.
 *
 * - Embedded: sends merchants to onboarding (if pending) or dashboard.
 * - Standalone: renders the marketing homepage.
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/lib/locale'
import { fetchOnboardingState } from '@/lib/onboarding'
import { HomePage } from '@/components/pages/HomePage'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { EmbeddedAuthGate } from '@/components/auth/EmbeddedAuthGate'

export default function Home() {
  const { isEmbedded, isLoading, appBridge } = useAkeedMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    if (isLoading || !isEmbedded) return

    let active = true

    const handleEmbeddedLanding = async () => {
      if (!active) return

      if (!appBridge) {
        router.replace(`/${locale}/dashboard${window.location.search}`)
        return
      }

      try {
        const { state } = await fetchOnboardingState()
        if (!active) return

        const destination =
          state.onboardingStatus === 'pending' ? 'onboarding' : 'dashboard'

        router.replace(`/${locale}/${destination}${window.location.search}`)
      } catch (error) {
        console.error('[Home] Failed to resolve onboarding state:', error)
        if (active) {
          router.replace(`/${locale}/dashboard${window.location.search}`)
        }
      }
    }

    void handleEmbeddedLanding()

    return () => {
      active = false
    }
  }, [appBridge, isEmbedded, isLoading, locale, router])

  if (isLoading || isEmbedded) {
    return <FullPageLoader />
  }

  return (
    <EmbeddedAuthGate fallback={<FullPageLoader />}>
      <HomePage />
    </EmbeddedAuthGate>
  )
}
