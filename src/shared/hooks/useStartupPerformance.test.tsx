import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useStartupPerformance,
  useStartupPainted,
} from './useStartupPerformance'

const onReport = vi.fn().mockResolvedValue(undefined)
const mode = {
  isEmbedded: true,
  shopify: { webVitals: { onReport } } as {
    webVitals?: { onReport: typeof onReport }
  },
}
vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

describe('Shopify Web Vitals diagnostics lifecycle', () => {
  it('reports successful content after an intervening frame and cancels unmounted work', () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=1')
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const view = renderHook(
      ({ ready }) =>
        useStartupPainted('dashboard-confirmations-painted', ready),
      { initialProps: { ready: false } }
    )
    expect(frames).toHaveLength(0)
    view.rerender({ ready: true })
    expect(console.debug).not.toHaveBeenCalled()
    frames[0](0)
    expect(console.debug).not.toHaveBeenCalled()
    frames[1](1)
    expect(console.debug).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(cancel).toHaveBeenCalled()
  })
  beforeEach(() => {
    vi.clearAllMocks()
    onReport.mockResolvedValue(undefined)
    mode.shopify = { webVitals: { onReport } }
    window.history.replaceState(null, '', '/en/dashboard')
    vi.spyOn(console, 'debug').mockImplementation(() => undefined)
  })
  afterEach(() => vi.restoreAllMocks())

  it('does not register the API without the opt-in flag', async () => {
    renderHook(() => useStartupPerformance(mode))
    await Promise.resolve()
    expect(onReport).not.toHaveBeenCalled()
  })

  it('unregisters on disable and ignores late reports from the old subscription', async () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=1')
    const view = renderHook(() => useStartupPerformance(mode))
    await waitFor(() => expect(onReport).toHaveBeenCalledTimes(1))
    const callback = onReport.mock.calls[0][0]
    callback({ metrics: [{ name: 'LCP', value: 1400 }] })
    expect(console.debug).toHaveBeenCalledWith(
      '[Akeed performance]',
      expect.objectContaining({ metric: 'LCP', value: 1400, source: 'shopify' })
    )
    window.history.replaceState(null, '', '/en/dashboard')
    view.rerender()
    await waitFor(() => expect(onReport).toHaveBeenLastCalledWith(null))
    vi.mocked(console.debug).mockClear()
    callback({ metrics: [{ name: 'LCP', value: 9999 }] })
    expect(console.debug).not.toHaveBeenCalled()
  })

  it('tolerates an absent or rejected optional Web Vitals API', async () => {
    window.history.replaceState(null, '', '/en/dashboard?akeed_perf=1')
    mode.shopify = {}
    const view = renderHook(() => useStartupPerformance(mode))
    expect(onReport).not.toHaveBeenCalled()
    onReport.mockRejectedValue(new Error('synthetic unavailable'))
    mode.shopify = { webVitals: { onReport } }
    view.rerender()
    await waitFor(() => expect(onReport).toHaveBeenCalledTimes(1))
    view.unmount()
  })
})
