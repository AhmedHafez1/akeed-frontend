'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { queryKeys } from '@/shared/query/keys'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import {
  createShopifySubscription,
  fetchShopifyPlans,
} from '../api/shopifyPlansApi'
import { PLAN_NAME_KEYS } from './planPresentation'
import type { ShopifyPlanCard, ShopifyPlanId } from './shopifyPlans'

const logger = createLogger('Billing')

/** Leaves the Shopify admin iframe for the charge approval page. */
function openConfirmation(confirmationUrl: string) {
  if (window.top && window.top !== window.self) {
    window.open(confirmationUrl, '_top')
  } else {
    window.location.href = confirmationUrl
  }
}

/**
 * Plan choice for an embedded store after onboarding: the plans with their
 * translated names, the store's free-plan eligibility, and activation through
 * Shopify's approval page. The smallest paid plan is selected until the
 * merchant picks another.
 */
export function useShopifyPlanUpgrade(options: {
  enabled: boolean
  hostParam: string | null
}) {
  const t = useTranslations('embeddedOnboarding')
  const [chosenPlanId, setSelectedPlanId] = useState<ShopifyPlanId | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plansQuery = useQuery({
    queryKey: [...queryKeys.billing.all, 'shopify-plans'],
    queryFn: ({ signal }) => fetchShopifyPlans(signal),
    enabled: options.enabled,
  })

  const response = plansQuery.data
  const isFreePlanClaimed = response?.isFreePlanClaimed ?? true
  const canManageBilling =
    response?.billingManagement?.mode === 'shopify' &&
    response.billingManagement.canManageBilling === true

  const plans = useMemo<ShopifyPlanCard[]>(
    () =>
      (response?.plans ?? []).map((plan) => ({
        ...plan,
        name: t(PLAN_NAME_KEYS[plan.id]),
      })),
    [response?.plans, t]
  )
  const paidPlans = useMemo(
    () =>
      plans
        .filter((plan) => plan.amount > 0)
        .sort((a, b) => a.includedVerifications - b.includedVerifications),
    [plans]
  )
  const starterPlan = plans.find((plan) => plan.amount === 0) ?? null
  const selectedPlanId = chosenPlanId ?? paidPlans[0]?.id ?? null

  const activate = useCallback(async () => {
    if (!selectedPlanId) return
    setError(null)
    setIsActivating(true)
    try {
      const { confirmationUrl } = await createShopifySubscription(
        selectedPlanId,
        options.hostParam ?? undefined
      )
      openConfirmation(confirmationUrl)
    } catch (activationError) {
      logger.error('Failed to activate plan', activationError)
      setError(
        activationError instanceof ApiError &&
          activationError.code === 'BILLING_FREE_PLAN_ALREADY_CLAIMED'
          ? t('freePlanAlreadyClaimedError')
          : t('billingActivationError')
      )
      setIsActivating(false)
    }
  }, [options.hostParam, selectedPlanId, t])

  return {
    plans,
    paidPlans,
    starterPlan,
    isLoading: plansQuery.isLoading,
    isFreePlanClaimed,
    canManageBilling,
    selectedPlanId,
    setSelectedPlanId,
    isActivating,
    error,
    clearError: () => setError(null),
    activate,
  }
}
