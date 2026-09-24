'use client'

import { useEffect, useRef } from 'react'
import { postOnboardingEvent } from '@/features/onboarding/api/onboardingApi'
import type { EmbeddedStep } from '../model/onboarding.config'

/**
 * Reports the two funnel moments only the browser sees: the setup screen
 * being shown (`setup_started`) and the merchant leaving the app before the
 * flow finished (`onboarding_exited`, with the step they left on).
 */
export function useOnboardingFunnelEvents(
  step: EmbeddedStep,
  isReady: boolean
) {
  const hasReportedStartRef = useRef(false)
  const stepRef = useRef(step)

  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    if (!isReady || step !== 'setup' || hasReportedStartRef.current) return
    hasReportedStartRef.current = true
    void postOnboardingEvent('setup_started')
  }, [isReady, step])

  useEffect(() => {
    if (!isReady) return
    const handlePageHide = () => {
      if (stepRef.current === 'success') return
      void postOnboardingEvent('onboarding_exited', stepRef.current)
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [isReady])
}
