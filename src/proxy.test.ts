import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import proxy from './proxy'

vi.mock('next-intl/middleware', () => ({
  default: () => () => new Response('ordinary-root'),
}))

describe('embedded root routing', () => {
  it.each(['ar', 'en', 'ur', 'es', 'fr', 'tr'])(
    'redirects %s roots and preserves every query parameter',
    (locale) => {
      const query =
        '?shop=synthetic.myshopify.com&host=synthetic&embedded=1&akeed_perf=1&range=today'
      for (const path of [`/${locale}`, `/${locale}/`]) {
        const response = proxy(
          new NextRequest(`https://example.test${path}${query}`)
        )
        expect(response.headers.get('location')).toBe(
          `https://example.test/${locale}/dashboard${query}`
        )
      }
    }
  )
  it('uses Arabic for an unprefixed embedded root without an explicit embedded flag', () => {
    expect(
      proxy(
        new NextRequest('https://example.test/?shop=synthetic&host=synthetic')
      ).headers.get('location')
    ).toBe('https://example.test/ar/dashboard?shop=synthetic&host=synthetic')
  })
  it.each([
    '',
    '?shop=synthetic',
    '?host=synthetic',
    '?shop=synthetic&host=synthetic&embedded=0',
    '?shop=&host=synthetic',
  ])('leaves ordinary roots alone: %s', (query) => {
    expect(
      proxy(new NextRequest(`https://example.test/en${query}`)).headers.get(
        'location'
      )
    ).toBeNull()
  })
})
