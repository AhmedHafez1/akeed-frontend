import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  INSTALL_CLICK_NAVIGATION_DELAY_MS,
  useInstallClickTracking,
} from './useInstallClickTracking'

const assign = vi.fn()

function Page() {
  useInstallClickTracking()
  return (
    <>
      <a href="https://apps.shopify.com/akeed?locale=ar">
        <span>Install on Shopify</span>
      </a>
      <a href="https://apps.shopify.com/akeed" target="_blank" rel="noreferrer">
        New tab
      </a>
      <a href="https://apps.shopify.com/akeed/reviews">Reviews</a>
      <a href="https://example.com/akeed">Elsewhere</a>
    </>
  )
}

describe('useInstallClickTracking', () => {
  let fbq: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    window.sessionStorage.clear()
    window.history.replaceState(null, '', '/ar?utm_source=facebook')
    fbq = vi.fn()
    window.fbq = fbq
    vi.stubGlobal('location', { ...window.location, assign })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    assign.mockReset()
    delete window.fbq
  })

  it('tracks InstallClick, adds the UTMs and navigates after the delay', () => {
    render(<Page />)
    const clicked = fireEvent.click(screen.getByText('Install on Shopify'))

    expect(clicked).toBe(false)
    expect(fbq).toHaveBeenCalledExactlyOnceWith('trackCustom', 'InstallClick')
    expect(assign).not.toHaveBeenCalled()

    vi.advanceTimersByTime(INSTALL_CLICK_NAVIGATION_DELAY_MS)
    const target = new URL(assign.mock.calls[0][0] as string)
    expect(target.searchParams.get('locale')).toBe('ar')
    expect(target.searchParams.get('utm_source')).toBe('facebook')
  })

  it('leaves new-tab links to the browser', () => {
    render(<Page />)
    const link = screen.getByText('New tab')
    const clicked = fireEvent.click(link)

    expect(clicked).toBe(true)
    expect(fbq).toHaveBeenCalledExactlyOnceWith('trackCustom', 'InstallClick')
    expect(link.getAttribute('href')).toContain('utm_source=facebook')
    vi.runAllTimers()
    expect(assign).not.toHaveBeenCalled()
  })

  it('tracks middle clicks without holding them', () => {
    render(<Page />)
    fireEvent(
      screen.getByText('Install on Shopify'),
      new MouseEvent('auxclick', { bubbles: true, button: 1 })
    )
    expect(fbq).toHaveBeenCalledExactlyOnceWith('trackCustom', 'InstallClick')
  })

  it('ignores other links', () => {
    render(<Page />)
    fireEvent.click(screen.getByText('Reviews'))
    fireEvent.click(screen.getByText('Elsewhere'))
    expect(fbq).not.toHaveBeenCalled()
  })
})
