import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import { ConfirmedOrdersCounter } from './ConfirmedOrdersCounter'

let reduceMotion = false
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => reduceMotion,
}))

const observers: Array<
  (entries: Partial<IntersectionObserverEntry>[]) => void
> = []

class FakeIntersectionObserver {
  constructor(
    callback: (entries: Partial<IntersectionObserverEntry>[]) => void
  ) {
    observers.push(callback)
  }
  observe(target: Element) {
    for (const callback of observers) {
      callback([{ isIntersecting: true, target, intersectionRatio: 1 }])
    }
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

const shownNumber = () =>
  document.querySelector('[aria-hidden="true"].tabular-nums')?.textContent

describe('ConfirmedOrdersCounter', () => {
  beforeEach(() => {
    observers.length = 0
    reduceMotion = false
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'performance'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('counts up to the real total once it is visible', () => {
    renderMarketing(<ConfirmedOrdersCounter total={12500} />, 'en')

    act(() => {
      vi.advanceTimersByTime(600)
    })
    const midway = Number(shownNumber()?.replace(/\D/g, ''))
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(12500)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(shownNumber()).toBe('12,500')
    expect(screen.getByText('orders confirmed through Akeed')).toBeTruthy()
  })

  it('shows the total at once when motion is reduced', () => {
    reduceMotion = true
    renderMarketing(<ConfirmedOrdersCounter total={12500} />, 'en')

    expect(shownNumber()).toBe('12,500')
  })

  it('gives assistive tech the real total, not the moving number', () => {
    renderMarketing(<ConfirmedOrdersCounter total={12500} />, 'en')

    expect(document.querySelector('.sr-only')?.textContent).toContain('12,500')
  })
})
