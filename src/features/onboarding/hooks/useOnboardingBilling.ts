'use client'

import { useCallback, useState } from 'react'
import { createOnboardingBilling } from '@/features/onboarding/api/onboardingApi'
import { createLogger } from '@/shared/lib/logger'
import type { OnboardingBillingPlanId } from '@/features/onboarding/domain/onboarding.types'

const logger = createLogger('Onboarding')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseOnboardingBillingParams {
  hostParam: string | null
  billingActivationErrorMessage: string
  setErrorBanner: (message: string | null) => void
  onBillingConfirmation: (confirmationUrl: string) => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages step-3 billing state: plan selection, activation, and management.
 *
 * Receives `setErrorBanner` from the coordinator so billing errors surface
 * in the same banner as init/settings errors without duplicating state.
 */
export function useOnboardingBilling({
  hostParam,
  billingActivationErrorMessage,
  setErrorBanner,
  onBillingConfirmation,
}: UseOnboardingBillingParams) {
  const [selectedPlanId, setSelectedPlanId] =
    useState<OnboardingBillingPlanId>('basic')
  const [isActivatingPlan, setIsActivatingPlan] = useState(false)
  const [isBillingRedirecting, setIsBillingRedirecting] = useState(false)

  const handleActivatePlan = useCallback(async () => {
    setErrorBanner(null)
    setIsActivatingPlan(true)

    try {
      const { confirmationUrl } = await createOnboardingBilling(
        selectedPlanId,
        hostParam ?? undefined
      )
      setIsBillingRedirecting(true)
      onBillingConfirmation(confirmationUrl)
    } catch (error) {
      logger.error('Failed to activate billing', error)
      setErrorBanner(billingActivationErrorMessage)
      setIsBillingRedirecting(false)
    } finally {
      setIsActivatingPlan(false)
    }
  }, [
    billingActivationErrorMessage,
    hostParam,
    onBillingConfirmation,
    selectedPlanId,
    setErrorBanner,
  ])

  const handleRetryBilling = useCallback(() => {
    setErrorBanner(null)
  }, [setErrorBanner])

  return {
    selectedPlanId,
    setSelectedPlanId,
    isActivatingPlan,
    isBillingRedirecting,
    handleActivatePlan,
    handleRetryBilling,
  }
}
