export const PRICING_FEATURE_INDICES = [1, 2, 3, 4, 5, 6] as const

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
  overageRate: number
  cappedAmount: number
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
    overageRate: 0,
    cappedAmount: 0,
    isFree: true,
  },
  basic: {
    id: 'basic',
    includedVerifications: 200,
    price: 9.99,
    overageRate: 0.035,
    cappedAmount: 14,
    isFree: false,
  },
  pro: {
    id: 'pro',
    includedVerifications: 500,
    price: 18.99,
    overageRate: 0.032,
    cappedAmount: 32,
    isFree: false,
  },
  business: {
    id: 'business',
    includedVerifications: 1500,
    price: 48.99,
    overageRate: 0.03,
    cappedAmount: 90,
    isFree: false,
  },
}
