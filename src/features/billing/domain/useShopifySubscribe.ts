'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import { createShopifySubscription } from '../api/shopifyPlansApi'
import type { ShopifyPlanId } from './shopifyPlans'

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
 * Sends an embedded store to Shopify to approve a plan: a change of plan, or
 * the current paid plan again (`renew`) to start a fresh period now.
 */
export function useShopifySubscribe(hostParam: string | null) {
  const t = useTranslations('embeddedOnboarding')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribe = useCallback(
    async (planId: ShopifyPlanId, options: { renew?: boolean } = {}) => {
      setError(null)
      setIsSubscribing(true)
      try {
        const { confirmationUrl } = await createShopifySubscription(
          planId,
          hostParam ?? undefined,
          options
        )
        openConfirmation(confirmationUrl)
      } catch (subscribeError) {
        logger.error('Failed to activate plan', subscribeError)
        setError(
          subscribeError instanceof ApiError &&
            subscribeError.code === 'BILLING_FREE_PLAN_ALREADY_CLAIMED'
            ? t('freePlanAlreadyClaimedError')
            : t('billingActivationError')
        )
        setIsSubscribing(false)
      }
    },
    [hostParam, t]
  )

  return {
    subscribe,
    isSubscribing,
    error,
    clearError: useCallback(() => setError(null), []),
  }
}
