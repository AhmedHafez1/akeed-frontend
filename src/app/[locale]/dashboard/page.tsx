'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/hooks/useAkeedMode'
import { fetchOnboardingState } from '@/lib/onboarding'
import { getLocaleFromPathname } from '@/lib/locale'
import { FullPageLoader } from '@/components/layout/FullPageLoader'
import { useDashboard, resolveDashboardSkin } from '@/features/dashboard'
import { buildEmbeddedRoute, isOnboardingCompletedByQuery } from '../embedded-routing.helpers'

export default function DashboardPage() {
  const { mode, isEmbedded, isLoading, appBridge } = useAkeedMode()
  const skinProps = useDashboard()
  const Skin = resolveDashboardSkin(mode)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')
  const onboardingParam = searchParams.get('onboarding')
  const billingStatusParam = searchParams.get('billing_status')
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (isLoading) return

    if (!isEmbedded || !appBridge) {
      setIsCheckingOnboarding(false)
      return
    }

    let active = true

    const verifyOnboarding = async () => {
      setIsCheckingOnboarding(true)
      const search = window.location.search

      // Billing callback already confirmed onboarding; skip bounce back.
      if (
        isOnboardingCompletedByQuery({
          onboardingParam,
          billingStatusParam,
        })
      ) {
        setIsCheckingOnboarding(false)
        return
      }

      try {
        const { state } = await fetchOnboardingState()
        if (!active) return

        if (state.onboardingStatus === 'pending') {
          router.replace(
            buildEmbeddedRoute({
              locale,
              destination: 'onboarding',
              search,
            })
          )
          return
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch onboarding state:', error)
      } finally {
        if (active) {
          setIsCheckingOnboarding(false)
        }
      }
    }

    void verifyOnboarding()

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

  if (isLoading || (isEmbedded && isCheckingOnboarding)) {
    return <FullPageLoader />
  }

  return <Skin {...skinProps} />
}
