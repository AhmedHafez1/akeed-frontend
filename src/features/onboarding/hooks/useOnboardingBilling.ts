'use client'

import { useCallback, useState } from 'react'
import { createOnboardingBilling } from '@/lib/onboarding'
import type { OnboardingBillingPlanId } from '@/types/embedded-onboarding.model'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseOnboardingBillingParams {
  hostParam: string | null
  billingActivationErrorMessage: string
  billingManagementUrl: string | null
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
  billingManagementUrl,
  setErrorBanner,
  onBillingConfirmation,
}: UseOnboardingBillingParams) {
  const [selectedPlanId, setSelectedPlanId] =
    useState<OnboardingBillingPlanId>('growth')
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
      console.error('[Onboarding] Failed to activate billing:', error)
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

  const handleManageBilling = useCallback(() => {
    if (!billingManagementUrl) return

    if (window.top && window.top !== window.self) {
      window.open(billingManagementUrl, '_top')
    } else {
      window.location.href = billingManagementUrl
    }
  }, [billingManagementUrl])

  return {
    selectedPlanId,
    setSelectedPlanId,
    isActivatingPlan,
    isBillingRedirecting,
    handleActivatePlan,
    handleRetryBilling,
    handleManageBilling,
  }
}
