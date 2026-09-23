'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { queryKeys } from '@/shared/query/keys'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import {
  createShopifySubscription,
  fetchShopifyPlans,
} from '../api/shopifyPlansApi'
import {
  RECOMMENDED_SHOPIFY_PLAN_ID,
  SHOPIFY_PLAN_DEFINITIONS,
  type ShopifyPlanCard,
  type ShopifyPlanId,
} from './shopifyPlans'

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
 * Plan choice for an embedded store after onboarding: the translated plan
 * cards, the store's free-plan eligibility, and activation through Shopify's
 * approval page.
 */
export function useShopifyPlanUpgrade(options: {
  enabled: boolean
  hostParam: string | null
}) {
  const t = useTranslations('embeddedOnboarding')
  const locale = useLocale()
  const [selectedPlanId, setSelectedPlanId] = useState<ShopifyPlanId>(
    RECOMMENDED_SHOPIFY_PLAN_ID
  )
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

  const plans = useMemo<ShopifyPlanCard[]>(() => {
    const numberLocale = locale === 'ar' ? 'ar' : 'en-US'
    const configById = new Map(
      (response?.plans ?? []).map((plan) => [plan.id, plan])
    )
    return SHOPIFY_PLAN_DEFINITIONS.map((definition) => {
      const config = configById.get(definition.id)
      const price = config
        ? config.amount === 0
          ? t('planPriceFree')
          : t('planPricePerMonth', {
              price: new Intl.NumberFormat(numberLocale, {
                style: 'currency',
                currency: config.currencyCode,
                minimumFractionDigits: Number.isInteger(config.amount) ? 0 : 2,
                maximumFractionDigits: 2,
              }).format(config.amount),
            })
        : t(definition.priceKey)
      return {
        id: definition.id,
        name: t(definition.nameKey),
        monthlyPriceLabel: price,
        monthlyVolumeLabel:
          config && definition.id !== 'starter'
            ? t('planVolumePerMonth', { count: config.includedVerifications })
            : t(definition.volumeKey),
        subtitle: t(definition.subtitleKey),
        features: definition.featureKeys.map((key) => t(key)),
        ctaLabel: t(definition.ctaKey),
      }
    })
  }, [locale, response?.plans, t])

  const activate = useCallback(async () => {
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
