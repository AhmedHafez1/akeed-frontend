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

  it('opens the Spanish listing for the Spanish site', () => {
    expect(getShopifyAppStoreListingUrl('es')).toBe(
      'https://apps.shopify.com/akeed?locale=es'
    )
  })

  it('opens the French listing for the French site', () => {
    expect(getShopifyAppStoreListingUrl('fr')).toBe(
      'https://apps.shopify.com/akeed?locale=fr'
    )
  })

  it.each(['en', 'tr', 'de', ''])(
    'keeps the default listing for "%s"',
    (locale) => {
      expect(getShopifyAppStoreListingUrl(locale)).toBe(
        SHOPIFY_APP_STORE_LISTING_URL
      )
    }
  )
})
