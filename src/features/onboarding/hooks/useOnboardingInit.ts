'use client'

import { useEffect, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  fetchOnboardingBillingPlans,
  fetchOnboardingState,
} from '@/features/onboarding/api/onboardingApi'
import { createLogger } from '@/shared/lib/logger'
import type {
  IntegrationOnboardingLanguage,
  IntegrationOnboardingState,
} from '@/features/onboarding/domain/onboarding.types'
import type { EmbeddedStep } from '../model/onboarding.config'

const logger = createLogger('Onboarding')

export interface UseOnboardingInitParams {
  isEmbedded: boolean
  isModeLoading: boolean
  locale: string
  router: AppRouterInstance
  /** `?step=test` reopens the test from the dashboard checklist. */
  requestedStep: string | null
  prefillWarningMessage: string
  setStep: (step: EmbeddedStep) => void
}

/**
 * Where a returning merchant lands. Setup not saved yet: setup. Saved but the
 * test was neither confirmed nor skipped: the test. Otherwise onboarding is
 * over and the dashboard is home, unless the checklist asked for the test.
 */
export function resolveResumeStep(
  state: IntegrationOnboardingState,
  requestedStep: string | null
): EmbeddedStep | 'dashboard' {
  if (state.onboardingStatus !== 'completed') return 'setup'
  if (requestedStep === 'test') return 'test'
  const activation = state.activation
  if (activation && !activation.testConfirmedAt && !activation.testSkippedAt) {
    return 'test'
  }
  return 'dashboard'
}

/**
 * Loads onboarding state once, picks the resume step and seeds the setup
 * form. Also reads whether the store's one free Starter claim is still
 * available, which decides the free-plan banner on the setup screen.
 */
export function useOnboardingInit({
  isEmbedded,
  isModeLoading,
  locale,
  router,
  requestedStep,
  prefillWarningMessage,
  setStep,
}: UseOnboardingInitParams) {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [initialStoreName, setInitialStoreName] = useState('')
  const [initialDefaultLanguage, setInitialDefaultLanguage] =
    useState<IntegrationOnboardingLanguage>('auto')
  const [initialIsAutoVerifyEnabled, setInitialIsAutoVerifyEnabled] =
    useState(true)
  const [initialMerchantPhone, setInitialMerchantPhone] = useState('')
  const [isFreePlanAvailable, setIsFreePlanAvailable] = useState(true)
  const [prefillWarning, setPrefillWarning] = useState<string | null>(null)

  /** Keeps the setup autosave from firing before the server values land. */
  const hasCompletedInitRef = useRef(false)

  useEffect(() => {
    if (isModeLoading) return

    if (!isEmbedded) {
      setIsInitialLoading(false)
      return
    }

    let active = true

    const load = async () => {
      setIsInitialLoading(true)

      try {
        const [{ state }, billingPlans] = await Promise.all([
          fetchOnboardingState(),
          fetchOnboardingBillingPlans().catch((error: unknown) => {
            logger.error('Failed to load billing plans', error)
            return null
          }),
        ])
        if (!active) return

        const resumeStep = resolveResumeStep(state, requestedStep)
        if (resumeStep === 'dashboard') {
          router.replace(`/${locale}/dashboard${window.location.search}`)
          return
        }

        setInitialStoreName(state.storeName ?? '')
        setInitialDefaultLanguage(state.defaultLanguage)
        setInitialIsAutoVerifyEnabled(state.isAutoVerifyEnabled)
        setInitialMerchantPhone(state.merchantWhatsappPhone ?? '')
        setIsFreePlanAvailable(
          billingPlans ? !billingPlans.isFreePlanClaimed : true
        )
        setStep(resumeStep)
      } catch (error) {
        logger.error('Failed to load state', error)
        if (active) setPrefillWarning(prefillWarningMessage)
      } finally {
        if (active) {
          setIsInitialLoading(false)
          hasCompletedInitRef.current = true
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [
    isEmbedded,
    isModeLoading,
    locale,
    prefillWarningMessage,
    requestedStep,
    router,
    setStep,
  ])

  return {
    isInitialLoading,
    initialStoreName,
    initialDefaultLanguage,
    initialIsAutoVerifyEnabled,
    initialMerchantPhone,
    isFreePlanAvailable,
    prefillWarning,
    hasCompletedInitRef,
  }
}
