'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import { createShopifySubscription } from '../api/shopifyPlansApi'
import type { ShopifyPlanId } from './shopifyPlans'

const logger = createLogger('Billing')

/** Why sending the merchant to Shopify failed, for a caller's own wording. */
export type ShopifySubscribeFailure = 'freePlanClaimed' | 'failed'

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
 * the current paid plan again (`renew`) to start a fresh period now. One
 * request at a time: a second click while one is pending does nothing, so a
 * double click never creates two Shopify subscriptions.
 */
export function useShopifySubscribe(
  hostParam: string | null,
  options: {
    /** Words for a failure; the plan picker's own wording by default. */
    errorMessage?: (failure: ShopifySubscribeFailure) => string
  } = {}
) {
  const t = useTranslations('embeddedOnboarding')
  const [subscribingPlanId, setSubscribingPlanId] =
    useState<ShopifyPlanId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(false)
  const { errorMessage } = options

  const subscribe = useCallback(
    async (
      planId: ShopifyPlanId,
      subscribeOptions: { renew?: boolean } = {}
    ) => {
      if (pending.current) return
      pending.current = true
      setError(null)
      setSubscribingPlanId(planId)
      try {
        const { confirmationUrl } = await createShopifySubscription(
          planId,
          hostParam ?? undefined,
          subscribeOptions
        )
        openConfirmation(confirmationUrl)
      } catch (subscribeError) {
        logger.error('Failed to activate plan', subscribeError)
        const failure: ShopifySubscribeFailure =
          subscribeError instanceof ApiError &&
          subscribeError.code === 'BILLING_FREE_PLAN_ALREADY_CLAIMED'
            ? 'freePlanClaimed'
            : 'failed'
        setError(
          errorMessage
            ? errorMessage(failure)
            : t(
                failure === 'freePlanClaimed'
                  ? 'freePlanAlreadyClaimedError'
                  : 'billingActivationError'
              )
        )
        setSubscribingPlanId(null)
        pending.current = false
      }
    },
    [errorMessage, hostParam, t]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    subscribe,
    subscribingPlanId,
    isSubscribing: subscribingPlanId !== null,
    error,
    clearError,
  }
}
