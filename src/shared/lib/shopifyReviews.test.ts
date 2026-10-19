import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ShopifyGlobal } from '@/shared/types/window.model'
import { requestShopifyReview } from './shopifyReviews'

function withReviews(reviews: ShopifyGlobal['reviews']) {
  window.shopify = { reviews } as ShopifyGlobal
}

describe('requestShopifyReview', () => {
  afterEach(() => {
    delete window.shopify
  })

  it('is unavailable without App Bridge or its Reviews API', async () => {
    expect(await requestShopifyReview()).toBe('unavailable')
    withReviews(undefined)
    expect(await requestShopifyReview()).toBe('unavailable')
  })

  it('reports success and Shopify decline codes', async () => {
    withReviews({ request: vi.fn().mockResolvedValue({ success: true }) })
    expect(await requestShopifyReview()).toBe('success')
    withReviews({
      request: vi
        .fn()
        .mockResolvedValue({ success: false, code: 'cooldown-period' }),
    })
    expect(await requestShopifyReview()).toBe('cooldown-period')
  })

  it('is unavailable when the call throws or the code is unknown', async () => {
    withReviews({ request: vi.fn().mockRejectedValue(new Error('boom')) })
    expect(await requestShopifyReview()).toBe('unavailable')
    withReviews({
      request: vi.fn().mockResolvedValue({
        success: false,
        code: 'something-new' as never,
      }),
    })
    expect(await requestShopifyReview()).toBe('unavailable')
  })
})
