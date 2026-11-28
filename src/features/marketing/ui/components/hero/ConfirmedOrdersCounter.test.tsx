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

const shownNumber = (stat: 'orders' | 'stores' = 'orders') =>
  document.querySelector(`[data-stat="${stat}"]`)?.textContent

const digits = (stat: 'orders' | 'stores') =>
  Number(shownNumber(stat)?.replace(/\D/g, ''))

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

  it('counts both numbers up to the real totals once visible', () => {
    renderMarketing(<ConfirmedOrdersCounter total={12500} stores={930} />, 'en')

    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(digits('orders')).toBeGreaterThan(0)
    expect(digits('orders')).toBeLessThan(12500)
    expect(digits('stores')).toBeGreaterThan(0)
    expect(digits('stores')).toBeLessThan(930)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(shownNumber('orders')).toBe('12,500')
    expect(shownNumber('stores')).toBe('930')
    expect(screen.getByText('orders confirmed through Akeed')).toBeTruthy()
    expect(screen.getByText('stores connected to Akeed')).toBeTruthy()
  })

  it('puts the stores before the orders', () => {
    renderMarketing(<ConfirmedOrdersCounter total={12500} stores={93} />, 'en')

    const order = Array.from(
      document.querySelectorAll<HTMLElement>('[data-stat]'),
      (element) => element.dataset.stat
    )
    expect(order).toEqual(['stores', 'orders'])
  })

  it('shows only the orders when the stores were not counted', () => {
    renderMarketing(
      <ConfirmedOrdersCounter total={12500} stores={null} />,
      'en'
    )

    expect(document.querySelector('[data-stat="stores"]')).toBeNull()
    expect(screen.queryByText('stores connected to Akeed')).toBeNull()
    expect(screen.getByText('orders confirmed through Akeed')).toBeTruthy()
  })

  it.each([
    [1, 'متجر مربوط بأكيد'],
    [5, 'متاجر مربوطة بأكيد'],
    [93, 'متجرًا مربوطًا بأكيد'],
    [100, 'متجر مربوط بأكيد'],
  ])('words the Arabic label for %i stores', (stores, label) => {
    renderMarketing(
      <ConfirmedOrdersCounter total={12500} stores={stores} />,
      'ar'
    )

    expect(screen.getByText(label)).toBeTruthy()
  })

  it('shows the totals at once when motion is reduced', () => {
    reduceMotion = true
    renderMarketing(<ConfirmedOrdersCounter total={12500} stores={93} />, 'en')

    expect(shownNumber('orders')).toBe('12,500')
    expect(shownNumber('stores')).toBe('93')
  })

  it('gives assistive tech the real totals, not the moving numbers', () => {
    renderMarketing(<ConfirmedOrdersCounter total={12500} stores={93} />, 'en')

    const spoken = Array.from(
      document.querySelectorAll('.sr-only'),
      (element) => element.textContent?.trim()
    )
    expect(spoken).toEqual(['93', '12,500'])
  })
})
