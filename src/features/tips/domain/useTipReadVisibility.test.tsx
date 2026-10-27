import { useRef } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTipReadVisibility } from './useTipReadVisibility'

let report: (ratio: number) => void
function Probe({
  onRead,
  enabled = true,
}: {
  onRead: () => void
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useTipReadVisibility(ref, onRead, enabled)
  return <div ref={ref}>Tip</div>
}

describe('useTipReadVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(element: Element) {
          report = (ratio) =>
            this.callback(
              [
                {
                  target: element,
                  isIntersecting: ratio > 0,
                  intersectionRatio: ratio,
                } as IntersectionObserverEntry,
              ],
              this as unknown as IntersectionObserver
            )
        }
        disconnect() {}
      }
    )
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('requires half visibility for two continuous seconds and fires only once', () => {
    const onRead = vi.fn()
    render(<Probe onRead={onRead} />)
    act(() => {
      report(0.49)
      vi.advanceTimersByTime(4000)
    })
    expect(onRead).not.toHaveBeenCalled()
    act(() => {
      report(0.5)
      vi.advanceTimersByTime(1999)
    })
    expect(onRead).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onRead).toHaveBeenCalledTimes(1)
    act(() => {
      report(0)
      report(1)
      vi.advanceTimersByTime(4000)
    })
    expect(onRead).toHaveBeenCalledTimes(1)
  })

  it('restarts the full timer after scrolling away', () => {
    const onRead = vi.fn()
    render(<Probe onRead={onRead} />)
    act(() => {
      report(1)
      vi.advanceTimersByTime(1500)
      report(0.4)
      vi.advanceTimersByTime(3000)
    })
    expect(onRead).not.toHaveBeenCalled()
    act(() => {
      report(1)
      vi.advanceTimersByTime(1999)
    })
    expect(onRead).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onRead).toHaveBeenCalledTimes(1)
  })

  it('restarts the full timer when the browser tab becomes visible again', () => {
    const onRead = vi.fn()
    const visibility = vi.spyOn(document, 'visibilityState', 'get')
    render(<Probe onRead={onRead} />)
    act(() => {
      report(1)
      vi.advanceTimersByTime(1500)
    })
    visibility.mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    act(() => vi.advanceTimersByTime(4000))
    expect(onRead).not.toHaveBeenCalled()
    visibility.mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    act(() => vi.advanceTimersByTime(1999))
    expect(onRead).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onRead).toHaveBeenCalledTimes(1)
  })

  it('does not reset the timer for intersections that remain above the threshold', () => {
    const onRead = vi.fn()
    render(<Probe onRead={onRead} />)
    act(() => {
      report(0.5)
      vi.advanceTimersByTime(1500)
      report(1)
      vi.advanceTimersByTime(500)
    })
    expect(onRead).toHaveBeenCalledTimes(1)
  })

  it('cancels a pending read when the panel closes and starts fresh on reopening', () => {
    const onRead = vi.fn()
    const { unmount } = render(<Probe onRead={onRead} />)
    act(() => {
      report(1)
      vi.advanceTimersByTime(1500)
    })
    unmount()
    act(() => vi.advanceTimersByTime(3000))
    expect(onRead).not.toHaveBeenCalled()
    render(<Probe onRead={onRead} />)
    act(() => {
      report(1)
      vi.advanceTimersByTime(2000)
    })
    expect(onRead).toHaveBeenCalledTimes(1)
  })

  it('never marks already-read cards or missing observer support as read', () => {
    const onRead = vi.fn()
    render(<Probe onRead={onRead} enabled={false} />)
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Probe onRead={onRead} />)
    act(() => vi.advanceTimersByTime(4000))
    expect(onRead).not.toHaveBeenCalled()
  })
})
