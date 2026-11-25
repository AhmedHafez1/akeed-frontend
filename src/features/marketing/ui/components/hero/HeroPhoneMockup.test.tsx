import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderMarketing } from '@/features/marketing/ui/marketingTestUtils'
import { HeroPhoneMockup } from './HeroPhoneMockup'

let reduceMotion = false
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => reduceMotion,
}))

let visible = true

class FakeIntersectionObserver {
  constructor(
    private callback: (entries: Partial<IntersectionObserverEntry>[]) => void
  ) {}
  observe(target: Element) {
    this.callback([
      { isIntersecting: visible, target, intersectionRatio: visible ? 1 : 0 },
    ])
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

const phone = () =>
  screen.getByRole('img', { name: /WhatsApp confirmation message/ })

const THANKS = 'Thanks for shopping with'

describe('HeroPhoneMockup', () => {
  beforeEach(() => {
    reduceMotion = false
    visible = true
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('plays the confirmation: tap, reply, then the thank-you', () => {
    renderMarketing(<HeroPhoneMockup />, 'en')

    expect(phone().textContent).toContain('Confirm Order')
    expect(phone().textContent).not.toContain(THANKS)

    // One act per stage, so each stage's timer is scheduled after its render.
    for (const ms of [2400, 900, 900, 1300]) {
      act(() => {
        vi.advanceTimersByTime(ms)
      })
    }
    expect(phone().textContent).toContain(THANKS)
    expect(phone().textContent).toContain('Your order has been confirmed.')
  })

  it('stays on the message while the phone is off screen', () => {
    visible = false
    renderMarketing(<HeroPhoneMockup />, 'en')

    act(() => {
      vi.advanceTimersByTime(20000)
    })
    expect(phone().textContent).toContain('Confirm Order')
    expect(phone().textContent).not.toContain(THANKS)
  })

  it('shows the finished chat at once when motion is reduced', () => {
    reduceMotion = true
    renderMarketing(<HeroPhoneMockup />, 'en')

    expect(phone().textContent).toContain(THANKS)
  })

  it('is a picture, never a control that could confirm an order', () => {
    renderMarketing(<HeroPhoneMockup />, 'ar')

    const arPhone = screen.getByRole('img', { name: /^رسالة تأكيد واتساب/ })
    expect(arPhone.querySelector('button, a')).toBeNull()
  })
})
