import type { ShopifyReviewRequestCode } from '@/shared/types/window.model'

/**
 * What a review request came to: Shopify's own code, or `unavailable` when
 * App Bridge has no Reviews API here or the call threw.
 */
export type ShopifyReviewCode = ShopifyReviewRequestCode | 'unavailable'

const SHOPIFY_REVIEW_CODES: ReadonlySet<string> =
  new Set<ShopifyReviewRequestCode>([
    'success',
    'already-reviewed',
    'annual-limit-reached',
    'cooldown-period',
    'merchant-ineligible',
    'mobile-app',
    'recently-installed',
    'cancelled',
    'already-open',
    'open-in-progress',
  ])

/**
 * Asks Shopify to open its native review modal. Never throws: a missing API,
 * a failure or a code this app does not know all come back as `unavailable`.
 */
export async function requestShopifyReview(): Promise<ShopifyReviewCode> {
  const reviews =
    typeof window === 'undefined' ? undefined : window.shopify?.reviews
  if (!reviews) return 'unavailable'
  try {
    const result = await reviews.request()
    const code = result.success ? 'success' : result.code
    return code && SHOPIFY_REVIEW_CODES.has(code)
      ? (code as ShopifyReviewRequestCode)
      : 'unavailable'
  } catch {
    return 'unavailable'
  }
}
