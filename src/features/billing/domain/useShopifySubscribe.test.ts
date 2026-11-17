import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/http'
import { shopifySubscribeFailure } from './useShopifySubscribe'

describe('shopifySubscribeFailure', () => {
  it('maps the free plan codes to their own failures', () => {
    expect(
      shopifySubscribeFailure(
        new ApiError('bad', 400, 'BILLING_FREE_PLAN_ALREADY_CLAIMED')
      )
    ).toBe('freePlanClaimed')
    expect(
      shopifySubscribeFailure(
        new ApiError('bad', 400, 'BILLING_FREE_PLAN_PHONE_REQUIRED')
      )
    ).toBe('freePlanPhoneRequired')
  })

  it('treats anything else as a plain failure', () => {
    expect(shopifySubscribeFailure(new ApiError('bad', 500, 'OTHER'))).toBe(
      'failed'
    )
    expect(shopifySubscribeFailure(new ApiError('bad', 500))).toBe('failed')
    expect(shopifySubscribeFailure(new Error('network'))).toBe('failed')
  })
})
