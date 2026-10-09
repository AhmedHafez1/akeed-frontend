import { describe, expect, it } from 'vitest'
import { formatPlanPrice } from '@/shared/lib/money'
import {
  COMPACT_FEATURE_KEYS,
  PER_MESSAGE_PRICE_DIGITS,
  SHARED_FEATURE_KEYS,
  USAGE_RULE_KEYS,
  formatMessageCount,
  isolateLtr,
  messagesPerDay,
  perMessagePrice,
} from './planPresentation'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'

describe('perMessagePrice', () => {
  it('rounds the price of one message to three decimals', () => {
    expect(perMessagePrice(9.99, 300)).toBe(0.033)
    expect(perMessagePrice(22.99, 1000)).toBe(0.023)
    expect(perMessagePrice(49.99, 2500)).toBe(0.02)
  })

  it('is zero for a free plan or an empty allowance', () => {
    expect(perMessagePrice(0, 30)).toBe(0)
    expect(perMessagePrice(9.99, 0)).toBe(0)
  })

  it('prints with all three decimals', () => {
    expect(
      formatPlanPrice(
        perMessagePrice(49.99, 2500),
        'USD',
        PER_MESSAGE_PRICE_DIGITS
      )
    ).toBe('US$ 0.020')
  })
})

describe('messagesPerDay', () => {
  it('spreads the allowance over 30 days, rounded down', () => {
    expect(messagesPerDay(300)).toBe(10)
    expect(messagesPerDay(1000)).toBe(33)
    expect(messagesPerDay(2500)).toBe(83)
    expect(messagesPerDay(0)).toBe(0)
  })
})

describe('formatting', () => {
  it('uses Western digits and thousands separators', () => {
    expect(formatMessageCount(2500)).toBe('2,500')
  })

  it('wraps a price in a left-to-right isolate', () => {
    const isolated = isolateLtr('US$ 9.99')
    expect(isolated.charCodeAt(0)).toBe(0x2066)
    expect(isolated.charCodeAt(isolated.length - 1)).toBe(0x2069)
    expect(isolated.slice(1, -1)).toBe('US$ 9.99')
  })
})

describe('shared copy keys', () => {
  it('lists six features, four of them in the compact list', () => {
    expect(SHARED_FEATURE_KEYS).toHaveLength(6)
    expect(COMPACT_FEATURE_KEYS).toHaveLength(4)
    for (const key of COMPACT_FEATURE_KEYS) {
      expect(SHARED_FEATURE_KEYS).toContain(key)
    }
  })

  it.each([
    ['ar', ar.billing.embeddedPlans],
    ['en', en.billing.embeddedPlans],
  ])('has a %s message for every feature and rule', (_, messages) => {
    expect(Object.keys(messages.features)).toEqual([...SHARED_FEATURE_KEYS])
    expect(Object.keys(messages.rules)).toEqual([...USAGE_RULE_KEYS])
    for (const rule of Object.values(messages.rules)) {
      expect(rule.label).toBeTruthy()
      expect(rule.body).toBeTruthy()
    }
  })
})
