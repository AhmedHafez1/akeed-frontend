function envInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Standalone credit pricing, mirroring the backend's
 * `src/shared/config/standalone-credit-billing.config.ts`.
 *
 * Quantities here are displayed credits: 1 credit = EGP 1, half the stored
 * credit the backend counts. Signed-in amounts come from the `/api/billing`
 * summary, which is authoritative; these exist because the public marketing
 * and signup pages are unauthenticated and `/api/billing` sits behind
 * `DualAuthGuard`. The in-app recharge tiles also share `CREDIT_PRESETS`.
 * Reading them through `NEXT_PUBLIC_*` means a price change is a redeploy env
 * var in both repos rather than a code change in one.
 */
export const CREDIT_CURRENCY = 'EGP'

export const CREDIT_UNIT_PRICE_MINOR = envInt(
  process.env.NEXT_PUBLIC_CREDIT_UNIT_PRICE_MINOR,
  100
)

export const CREDIT_FREE_GRANT = envInt(
  process.env.NEXT_PUBLIC_CREDIT_FREE_GRANT,
  60
)

export const CREDIT_PURCHASE_MIN = envInt(
  process.env.NEXT_PUBLIC_CREDIT_PURCHASE_MIN,
  200
)

export const CREDIT_PURCHASE_MAX = envInt(
  process.env.NEXT_PUBLIC_CREDIT_PURCHASE_MAX,
  10000
)

export const CREDIT_PURCHASE_STEP = envInt(
  process.env.NEXT_PUBLIC_CREDIT_PURCHASE_STEP,
  100
)

export const CREDIT_LOW_BALANCE_THRESHOLD = envInt(
  process.env.NEXT_PUBLIC_CREDIT_LOW_BALANCE_THRESHOLD,
  20
)

/**
 * Preset recharge sizes. Presentation only — the API exposes a continuous
 * `{min, max, step}` range, not packages. Shared with the in-app recharge tiles
 * so the two surfaces cannot drift.
 */
export const CREDIT_PRESETS = [200, 500, 1000, 2000] as const

/** Credits one WhatsApp message from the Akeed number uses. */
export const CREDITS_PER_MESSAGE = 2

/** What the free grant buys, for copy that counts messages. */
export const CREDIT_FREE_MESSAGES = Math.floor(
  CREDIT_FREE_GRANT / CREDITS_PER_MESSAGE
)

/** One message from the Akeed number. */
export const CREDIT_MESSAGE_PRICE_MINOR =
  CREDIT_UNIT_PRICE_MINOR * CREDITS_PER_MESSAGE

/*
 * The Shopify plan mirror that used to live here is gone. Shopify's monthly
 * plans are presented by Shopify itself on the App Store listing, and the
 * embedded billing step reads the authoritative plan config from the backend —
 * neither needed a second copy, and the copy had already drifted (the marketing
 * page advertised 3,000 monthly messages on Scale against the backend's 2,500).
 */
