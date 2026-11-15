import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmbeddedNavigation } from './EmbeddedNavigation'

vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

describe('embedded navigation diagnostic opt-in', () => {
  it('reports pointer activation without including embedded identifiers', () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=1')
    const log = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    render(<EmbeddedNavigation />)
    fireEvent.pointerDown(screen.getByText('Settings'))
    expect(log).toHaveBeenCalledWith(
      '[Akeed performance]',
      expect.objectContaining({
        metric: 'navigation-start',
        path: '/en/settings',
      })
    )
    log.mockRestore()
  })
  it.each(['ar', 'en'])(
    'preserves the flag on %s sidebar links without copying Shopify parameters',
    (locale) => {
      window.history.replaceState(
        null,
        '',
        `/${locale}/dashboard?akeed_perf=1&shop=synthetic.myshopify.com&host=synthetic&token=synthetic-only`
      )
      render(<EmbeddedNavigation />)
      expect(screen.getByText('Dashboard').getAttribute('href')).toBe(
        `/${locale}/dashboard?akeed_perf=1`
      )
      expect(screen.getByText('Settings').getAttribute('href')).toBe(
        `/${locale}/settings?akeed_perf=1`
      )
    }
  )

  it('keeps ordinary sidebar URLs unchanged', () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=0')
    render(<EmbeddedNavigation />)
    expect(screen.getByText('Dashboard').getAttribute('href')).toBe(
      '/en/dashboard'
    )
    expect(screen.getByText('Settings').getAttribute('href')).toBe(
      '/en/settings'
    )
  })
})
