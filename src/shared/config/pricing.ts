function envInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Standalone credit pricing, mirroring the backend's
 * `src/shared/config/standalone-credit-billing.config.ts`.
 *
 * The authenticated app never reads these — it reads the `/api/billing`
 * summary, which is authoritative. They exist only because the public marketing
 * page is unauthenticated and `/api/billing` sits behind `DualAuthGuard`, so
 * there is no endpoint for it to ask. Reading them through `NEXT_PUBLIC_*`
 * means a price change is a redeploy env var in both repos rather than a code
 * change in one.
 */
export const CREDIT_CURRENCY = 'EGP'

export const CREDIT_UNIT_PRICE_MINOR = envInt(
  process.env.NEXT_PUBLIC_CREDIT_UNIT_PRICE_MINOR,
  200
)

export const CREDIT_FREE_GRANT = envInt(
  process.env.NEXT_PUBLIC_CREDIT_FREE_GRANT,
  30
)

export const CREDIT_PURCHASE_MIN = envInt(
  process.env.NEXT_PUBLIC_CREDIT_PURCHASE_MIN,
  100
)

export const CREDIT_PURCHASE_MAX = envInt(
  process.env.NEXT_PUBLIC_CREDIT_PURCHASE_MAX,
  5000
)

export const CREDIT_PURCHASE_STEP = envInt(
  process.env.NEXT_PUBLIC_CREDIT_PURCHASE_STEP,
  50
)

export const CREDIT_LOW_BALANCE_THRESHOLD = envInt(
  process.env.NEXT_PUBLIC_CREDIT_LOW_BALANCE_THRESHOLD,
  10
)

/**
 * Preset recharge sizes. Presentation only — the API exposes a continuous
 * `{min, max, step}` range, not packages. Shared with the in-app recharge tiles
 * so the two surfaces cannot drift.
 */
export const CREDIT_PRESETS = [100, 250, 500, 1000] as const

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
