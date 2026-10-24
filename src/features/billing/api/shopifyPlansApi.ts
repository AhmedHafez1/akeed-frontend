import { api } from '@/shared/lib/auth'
import type {
  ShopifyPlanId,
  ShopifyPlansResponse,
} from '../domain/shopifyPlans'

export function fetchShopifyPlans(signal?: AbortSignal) {
  return api.get<ShopifyPlansResponse>('/api/onboarding/billing/plans', {
    signal,
  })
}

/**
 * Returns Shopify's confirmation URL; the merchant approves the charge there.
 * `renew` buys the active paid plan again, starting a fresh period now.
 */
export function createShopifySubscription(
  planId: ShopifyPlanId,
  host?: string,
  options: { renew?: boolean } = {}
) {
  return api.post<{ confirmationUrl: string }>('/api/onboarding/billing', {
    planId,
    host,
    ...(options.renew ? { renew: true } : {}),
  })
}
