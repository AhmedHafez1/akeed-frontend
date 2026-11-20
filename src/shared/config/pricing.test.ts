import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadPricing(flag: string | undefined) {
  vi.resetModules()
  if (flag === undefined) vi.unstubAllEnvs()
  else vi.stubEnv('NEXT_PUBLIC_OWN_NUMBER_PRICING_ENABLED', flag)
  return import('./pricing')
}

describe('own-number pricing config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([undefined, 'false', 'TRUE', '1'])(
    'keeps the public promotion off when the switch is %s',
    async (flag) => {
      const { OWN_NUMBER_PRICING_ENABLED } = await loadPricing(flag)
      expect(OWN_NUMBER_PRICING_ENABLED).toBe(false)
    }
  )

  it('turns the public promotion on only for "true"', async () => {
    const { OWN_NUMBER_PRICING_ENABLED } = await loadPricing('true')
    expect(OWN_NUMBER_PRICING_ENABLED).toBe(true)
  })

  it('prices an own-number message at half the Akeed message', async () => {
    const pricing = await loadPricing(undefined)
    expect(pricing.CREDITS_PER_MESSAGE).toBe(2)
    expect(pricing.OWN_NUMBER_CREDITS_PER_MESSAGE).toBe(1)
    expect(pricing.OWN_NUMBER_MESSAGE_PRICE_MINOR * 2).toBe(
      pricing.CREDIT_MESSAGE_PRICE_MINOR
    )
  })

  it('defaults to EGP 1 a message, 100 free messages and EGP 100–5,000 top-ups', async () => {
    const pricing = await loadPricing(undefined)
    expect(pricing.CREDIT_MESSAGE_PRICE_MINOR).toBe(100)
    expect(pricing.OWN_NUMBER_MESSAGE_PRICE_MINOR).toBe(50)
    expect(pricing.CREDIT_FREE_MESSAGES).toBe(100)
    const pounds = (credits: number) =>
      (credits * pricing.CREDIT_UNIT_PRICE_MINOR) / 100
    expect(pounds(pricing.CREDIT_PURCHASE_MIN)).toBe(100)
    expect(pounds(pricing.CREDIT_PURCHASE_MAX)).toBe(5000)
    expect(pounds(pricing.CREDIT_PURCHASE_STEP)).toBe(50)
    expect(pricing.CREDIT_PRESETS.map(pounds)).toEqual([100, 250, 500, 1000])
  })

  it('mirrors the backend plan allowances and own-number pools', async () => {
    const { SHOPIFY_PUBLIC_ALLOWANCES } = await loadPricing(undefined)
    expect(
      SHOPIFY_PUBLIC_ALLOWANCES.map((plan) => [
        plan.id,
        plan.akeedMessages,
        plan.ownNumberMessages,
        plan.oneTime,
      ])
    ).toEqual([
      ['starter', 30, 90, true],
      ['basic', 300, 1000, false],
      ['pro', 1000, 5000, false],
      ['business', 2500, 20000, false],
    ])
  })
})
