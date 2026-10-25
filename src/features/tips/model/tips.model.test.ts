import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl, resolveTipHref } from './tips.model'

describe('resolveTipHref', () => {
  it('keeps the Shopify context and drops dashboard view state in embedded mode', () => {
    expect(
      resolveTipHref(
        'settings_timing',
        'embedded',
        'ar',
        'shop=demo.myshopify.com&host=abc&tab=confirmations&range=7d&embedded=1'
      )
    ).toBe(
      '/ar/settings?shop=demo.myshopify.com&host=abc&embedded=1&tab=timing'
    )
  })

  it("maps the same key to each mode's own page", () => {
    expect(resolveTipHref('plan', 'standalone', 'en', 'range=7d')).toBe(
      '/en/billing'
    )
    expect(resolveTipHref('verifications', 'embedded', 'en', 'host=h')).toBe(
      '/en/dashboard?host=h&tab=confirmations'
    )
  })

  it('shows no link for a page the mode lacks or an unknown key', () => {
    expect(resolveTipHref('imports_new', 'embedded', 'en', '')).toBeNull()
    expect(resolveTipHref('admin', 'standalone', 'en', '')).toBeNull()
  })
})

describe('isSafeExternalUrl', () => {
  it.each([
    ['https://akeed.app/docs', true],
    ['http://akeed.app', false],
    ['javascript:alert(1)', false],
    ['//evil.example.com', false],
    ['https://user:pw@akeed.app', false],
  ])('%s → %s', (url, expected) => {
    expect(isSafeExternalUrl(url)).toBe(expected)
  })
})
