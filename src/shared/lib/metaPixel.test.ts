import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  captureLandingAttribution,
  isShopifyInstallUrl,
  readMetaBrowserIds,
  trackMetaCustomEvent,
  trackMetaEvent,
  withUtmParams,
} from './metaPixel'

function setUrl(path: string) {
  window.history.replaceState(null, '', path)
}

function clearCookies() {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim()
    if (name)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

describe('metaPixel', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    clearCookies()
    setUrl('/')
  })

  afterEach(() => {
    delete window.fbq
  })

  it('does nothing when the Pixel is not loaded', () => {
    expect(() => trackMetaCustomEvent('InstallClick')).not.toThrow()
    expect(() => trackMetaEvent('CompleteRegistration', 'id')).not.toThrow()
  })

  it('sends standard events with the event ID Meta dedupes on', () => {
    const fbq = vi.fn()
    window.fbq = fbq
    trackMetaEvent('CompleteRegistration', 'evt-1')
    trackMetaCustomEvent('InstallClick')
    expect(fbq).toHaveBeenNthCalledWith(
      1,
      'track',
      'CompleteRegistration',
      {},
      { eventID: 'evt-1' }
    )
    expect(fbq).toHaveBeenNthCalledWith(2, 'trackCustom', 'InstallClick')
  })

  it.each([
    ['https://apps.shopify.com/akeed', true],
    ['https://apps.shopify.com/akeed?locale=ar', true],
    ['https://apps.shopify.com/akeed/reviews', false],
    ['https://apps.shopify.com/other-app', false],
    ['https://getakeed.com/akeed', false],
    ['not a url', false],
  ])('isShopifyInstallUrl(%s) is %s', (href, expected) => {
    expect(isShopifyInstallUrl(href)).toBe(expected)
  })

  it('carries the current page UTMs and keeps the link locale', () => {
    setUrl('/ar?utm_source=facebook&utm_campaign=launch&other=x')
    const result = new URL(
      withUtmParams('https://apps.shopify.com/akeed?locale=ar')
    )
    expect(result.searchParams.get('locale')).toBe('ar')
    expect(result.searchParams.get('utm_source')).toBe('facebook')
    expect(result.searchParams.get('utm_campaign')).toBe('launch')
    expect(result.searchParams.has('other')).toBe(false)
  })

  it('remembers landing UTMs across pages in the session', () => {
    captureLandingAttribution('?utm_source=facebook&utm_medium=paid')
    setUrl('/en/pricing')
    const result = new URL(withUtmParams('https://apps.shopify.com/akeed'))
    expect(result.searchParams.get('utm_source')).toBe('facebook')
    expect(result.searchParams.get('utm_medium')).toBe('paid')
  })

  it('leaves the link alone without UTMs', () => {
    expect(withUtmParams('https://apps.shopify.com/akeed')).toBe(
      'https://apps.shopify.com/akeed'
    )
  })

  it('reads the Pixel cookies', () => {
    document.cookie = '_fbp=fb.1.1700000000000.123'
    document.cookie = '_fbc=fb.1.1700000000000.abc'
    expect(readMetaBrowserIds()).toEqual({
      fbp: 'fb.1.1700000000000.123',
      fbc: 'fb.1.1700000000000.abc',
    })
  })

  it('rebuilds fbc from the landing fbclid when the cookie is missing', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    captureLandingAttribution('?fbclid=click-1')
    expect(readMetaBrowserIds()).toEqual({
      fbc: 'fb.1.1700000000000.click-1',
    })
    vi.restoreAllMocks()
  })
})
