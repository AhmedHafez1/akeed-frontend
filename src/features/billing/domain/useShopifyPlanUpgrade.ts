'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { queryKeys } from '@/shared/query/keys'
import { fetchShopifyPlans } from '../api/shopifyPlansApi'
import { PLAN_NAME_KEYS } from './planPresentation'
import type { ShopifyPlanCard, ShopifyPlanId } from './shopifyPlans'
import { useShopifySubscribe } from './useShopifySubscribe'

/**
 * Plan choice for an embedded store after onboarding: the plans with their
 * translated names, the store's current plan and free-plan eligibility, and
 * activation through Shopify's approval page. The next plan up from the
 * current one is selected until the merchant picks another (the cheapest paid
 * plan with none, the current one on the top plan). Choosing the current paid
 * plan renews it.
 */
export function useShopifyPlanUpgrade(options: {
  enabled: boolean
  hostParam: string | null
}) {
  const t = useTranslations('embeddedOnboarding')
  const [chosenPlanId, setSelectedPlanId] = useState<ShopifyPlanId | null>(null)
  const { subscribe, isSubscribing, error, clearError } = useShopifySubscribe(
    options.hostParam
  )

  const plansQuery = useQuery({
    queryKey: [...queryKeys.billing.all, 'shopify-plans'],
    queryFn: ({ signal }) => fetchShopifyPlans(signal),
    enabled: options.enabled,
  })

  const response = plansQuery.data
  const isFreePlanClaimed = response?.isFreePlanClaimed ?? true
  const currentPlanId = response?.currentPlanId ?? null
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
  const currentPaidIndex = paidPlans.findIndex(
    (plan) => plan.id === currentPlanId
  )
  const defaultPlanId =
    currentPaidIndex < 0
      ? paidPlans[0]?.id
      : (paidPlans[currentPaidIndex + 1] ?? paidPlans[currentPaidIndex]).id
  const selectedPlanId = chosenPlanId ?? defaultPlanId ?? null
  const isRenewal = currentPaidIndex >= 0 && selectedPlanId === currentPlanId

  const activate = useCallback(async () => {
    if (!selectedPlanId) return
    await subscribe(selectedPlanId, { renew: isRenewal })
  }, [isRenewal, selectedPlanId, subscribe])

  return {
    plans,
    paidPlans,
    starterPlan,
    isLoading: plansQuery.isLoading,
    isFreePlanClaimed,
    canManageBilling,
    currentPlanId,
    selectedPlanId,
    setSelectedPlanId,
    isRenewal,
    isActivating: isSubscribing,
    error,
    clearError,
    activate,
  }
}
