export const SHOPIFY_APP_STORE_LISTING_URL = 'https://apps.shopify.com/akeed'

/** The listing with Shopify's write-a-review dialog open. */
export const SHOPIFY_APP_STORE_REVIEW_URL = `${SHOPIFY_APP_STORE_LISTING_URL}#modal-show=WriteReviewModal`
/** The listing's public reviews, where a merchant finds the review they left. */
export const SHOPIFY_APP_STORE_REVIEWS_URL = `${SHOPIFY_APP_STORE_LISTING_URL}/reviews`

/** App Store languages Akeed links to by name; the rest get the default. */
const SHOPIFY_APP_STORE_LISTING_LOCALES: ReadonlySet<string> = new Set([
  'ar',
  'ur',
  'es',
  'fr',
])

/** The App Store listing in the visitor's language, or the default one. */
export function getShopifyAppStoreListingUrl(locale: string): string {
  return SHOPIFY_APP_STORE_LISTING_LOCALES.has(locale)
    ? `${SHOPIFY_APP_STORE_LISTING_URL}?locale=${locale}`
    : SHOPIFY_APP_STORE_LISTING_URL
}
