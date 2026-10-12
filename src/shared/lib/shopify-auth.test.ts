import { describe, expect, it } from 'vitest'
import {
  SHOPIFY_APP_STORE_LISTING_URL,
  getShopifyAppStoreListingUrl,
} from './shopify-auth'

describe('getShopifyAppStoreListingUrl', () => {
  it('opens the Arabic listing for the Arabic site', () => {
    expect(getShopifyAppStoreListingUrl('ar')).toBe(
      'https://apps.shopify.com/akeed?locale=ar'
    )
  })

  it('opens the Urdu listing for the Urdu site', () => {
    expect(getShopifyAppStoreListingUrl('ur')).toBe(
      'https://apps.shopify.com/akeed?locale=ur'
    )
  })

  it.each(['en', 'fr', ''])('keeps the default listing for "%s"', (locale) => {
    expect(getShopifyAppStoreListingUrl(locale)).toBe(
      SHOPIFY_APP_STORE_LISTING_URL
    )
  })
})
