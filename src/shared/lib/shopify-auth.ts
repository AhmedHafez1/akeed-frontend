export const SHOPIFY_APP_STORE_LISTING_URL = 'https://apps.shopify.com/akeed'

export function openShopifyAppStore(): void {
  window.location.assign(SHOPIFY_APP_STORE_LISTING_URL)
}
