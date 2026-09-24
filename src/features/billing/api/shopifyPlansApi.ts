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

/** Returns Shopify's confirmation URL; the merchant approves the charge there. */
export function createShopifySubscription(
  planId: ShopifyPlanId,
  host?: string
) {
  return api.post<{ confirmationUrl: string }>('/api/onboarding/billing', {
    planId,
    host,
  })
}
