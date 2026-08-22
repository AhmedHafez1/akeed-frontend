export const PRICING_FEATURE_INDICES_BY_PLAN: Record<
  string,
  readonly number[]
> = {
  starter: [1, 2, 3, 4],
  basic: [1, 2, 3, 5, 4],
  pro: [1, 2, 3, 4, 5, 6],
  business: [1, 2, 3, 4, 5, 6],
}

export function getPricingFeatureKey(
  planId: string,
  featureIndex: number
): string {
  return `${planId}_feature_${featureIndex}`
}

export interface BillingPlanDefaults {
  id: string
  includedVerifications: number
  price: number
  isFree: boolean
}

/**
 * Frontend mirror of backend BILLING_PLAN_TEMPLATES.
 * Used as fallback when backend data is unavailable (e.g. public marketing page)
 * and as the single place to update plan constants in the frontend.
 */
export const BILLING_PLANS: Record<string, BillingPlanDefaults> = {
  starter: {
    id: 'starter',
    includedVerifications: 30,
    price: 0,
    isFree: true,
  },
  basic: {
    id: 'basic',
    includedVerifications: 300,
    price: 9.99,
    isFree: false,
  },
  pro: {
    id: 'pro',
    includedVerifications: 1000,
    price: 22.99,
    isFree: false,
  },
  business: {
    id: 'business',
    includedVerifications: 2500,
    price: 49.99,
    isFree: false,
  },
}
