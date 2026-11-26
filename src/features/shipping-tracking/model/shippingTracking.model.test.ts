import { describe, expect, it } from 'vitest'
import {
  isTrackingCode,
  parseShippingTrackingView,
} from './shippingTracking.model'

describe('isTrackingCode', () => {
  it('accepts the codes the backend issues and nothing else', () => {
    expect(isTrackingCode('Xk3pQ9vT2mLr8sYwB4nHcA')).toBe(true)
    expect(isTrackingCode('short')).toBe(false)
    expect(isTrackingCode('../../etc/passwd/aaaaaaaaaaa')).toBe(false)
    expect(isTrackingCode('a'.repeat(44))).toBe(false)
  })
})

describe('parseShippingTrackingView', () => {
  it('follows only an https redirect', () => {
    expect(
      parseShippingTrackingView({
        kind: 'redirect',
        url: 'https://carrier.example/t/9',
      })
    ).toEqual({ kind: 'redirect', url: 'https://carrier.example/t/9' })
    for (const url of ['http://x.example', 'javascript:alert(1)', 3]) {
      expect(parseShippingTrackingView({ kind: 'redirect', url })).toEqual({
        kind: 'unavailable',
      })
    }
  })

  it('reads the page and falls back to Arabic for an unknown language', () => {
    expect(
      parseShippingTrackingView({
        kind: 'page',
        language: 'xx',
        storeName: ' Cairo Store ',
        orderNumber: '#1042',
        courier: null,
        trackingNumber: '',
      })
    ).toEqual({
      kind: 'page',
      language: 'ar',
      storeName: 'Cairo Store',
      orderNumber: '#1042',
      courier: null,
      trackingNumber: null,
    })
  })

  it('treats anything else as unavailable', () => {
    expect(parseShippingTrackingView(null)).toEqual({ kind: 'unavailable' })
    expect(parseShippingTrackingView({ kind: 'other' })).toEqual({
      kind: 'unavailable',
    })
  })
})
