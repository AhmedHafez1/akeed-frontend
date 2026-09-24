'use client'

import { useCallback, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useOnboardingInit } from './useOnboardingInit'
import {
  useOnboardingSettings,
  type SetupFormMessages,
} from './useOnboardingSettings'
import { useOnboardingTest } from './useOnboardingTest'
import { useOnboardingFunnelEvents } from './useOnboardingFunnelEvents'
import type { EmbeddedStep } from '../model/onboarding.config'

interface EmbeddedOnboardingMessages extends SetupFormMessages {
  prefillWarning: string
}

interface UseEmbeddedOnboardingParams {
  isEmbedded: boolean
  isModeLoading: boolean
  locale: string
  requestedStep: string | null
  router: AppRouterInstance
  messages: EmbeddedOnboardingMessages
}

/**
 * Embedded onboarding v2 coordinator. Owns the current step and the error
 * banner, and wires the focused hooks together:
 *
 *   useOnboardingInit          load state, pick the resume step
 *   useOnboardingSettings      quick setup form and submit (goes live)
 *   useOnboardingTest          free test message: send, poll, resend, skip
 *   useOnboardingFunnelEvents  setup_started / onboarding_exited
 */
export function useEmbeddedOnboarding({
  isEmbedded,
  isModeLoading,
  locale,
  requestedStep,
  router,
  messages,
}: UseEmbeddedOnboardingParams) {
  const [step, setStep] = useState<EmbeddedStep>('setup')
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const freshSendRequestedRef = useRef(false)
  const stableSetStep = useCallback((next: EmbeddedStep) => setStep(next), [])
  const completeSetupStep = useCallback((next: EmbeddedStep) => {
    if (next === 'test') freshSendRequestedRef.current = true
    setStep(next)
  }, [])
  const stableSetErrorBanner = useCallback(
    (message: string | null) => setErrorBanner(message),
    []
  )

  const init = useOnboardingInit({
    isEmbedded,
    isModeLoading,
    locale,
    router,
    requestedStep,
    prefillWarningMessage: messages.prefillWarning,
    setStep: stableSetStep,
  })

  const settings = useOnboardingSettings({
    step,
    setStep: completeSetupStep,
    setErrorBanner: stableSetErrorBanner,
    messages,
    hasCompletedInitRef: init.hasCompletedInitRef,
    initialStoreName: init.initialStoreName,
    initialDefaultLanguage: init.initialDefaultLanguage,
    initialIsAutoVerifyEnabled: init.initialIsAutoVerifyEnabled,
    initialMerchantPhone: init.initialMerchantPhone,
  })

  const goToDashboard = useCallback(() => {
    router.push(`/${locale}/dashboard${window.location.search}`)
  }, [locale, router])

  const handleTestConfirmed = useCallback(() => setStep('success'), [])

  const test = useOnboardingTest({
    isActive: !init.isInitialLoading && step !== 'setup',
    freshSendRequestedRef,
    onConfirmed: handleTestConfirmed,
    onSkipped: goToDashboard,
  })

  useOnboardingFunnelEvents(step, isEmbedded && !init.isInitialLoading)

  const handleChangeNumber = useCallback(() => setStep('setup'), [])

  return {
    isInitialLoading: init.isInitialLoading,
    step,
    errorBanner,
    prefillWarning: init.prefillWarning,
    isFreePlanAvailable: init.isFreePlanAvailable,
    settings,
    test,
    goToDashboard,
    handleChangeNumber,
  }
}
