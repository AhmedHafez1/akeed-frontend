export const SHOPIFY_APP_STORE_LISTING_URL = 'https://apps.shopify.com/akeed'

const SHOPIFY_APP_STORE_ARABIC_LISTING_URL = `${SHOPIFY_APP_STORE_LISTING_URL}?locale=ar`

/** The App Store listing in the visitor's language: Arabic or the default. */
export function getShopifyAppStoreListingUrl(locale: string): string {
  return locale === 'ar'
    ? SHOPIFY_APP_STORE_ARABIC_LISTING_URL
    : SHOPIFY_APP_STORE_LISTING_URL
}
