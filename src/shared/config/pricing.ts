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

/*
 * The Shopify plan mirror that used to live here is gone. Shopify's monthly
 * plans are presented by Shopify itself on the App Store listing, and the
 * embedded billing step reads the authoritative plan config from the backend —
 * neither needed a second copy, and the copy had already drifted (the marketing
 * page advertised 3,000 monthly messages on Scale against the backend's 2,500).
 */
