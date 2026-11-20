import { describe, expect, it } from 'vitest'
import {
  creditsToMinor,
  formatBalance,
  formatBalanceParts,
  minorToCredits,
} from './balanceMoney'

const bidiMarks = new RegExp(`[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`)

describe('creditsToMinor / minorToCredits', () => {
  it('prices displayed credits at the unit price', () => {
    // 301 displayed credits at EGP 0.50: EGP 150.50.
    expect(creditsToMinor(301, 50)).toBe(15050)
    expect(creditsToMinor(0, 50)).toBe(0)
  })

  it('turns an amount back into the displayed quantity the API buys', () => {
    expect(minorToCredits(10000, 50)).toBe(200)
    expect(minorToCredits(500000, 50)).toBe(10000)
  })

  it('rounds a part-credit amount up, and refuses an unknown price', () => {
    expect(minorToCredits(125, 50)).toBe(3)
    expect(minorToCredits(100, 0)).toBe(0)
  })
})

describe('formatBalance', () => {
  it('drops .00 on whole amounts and keeps a half', () => {
    expect(formatBalance(10000, 'EGP', 'en')).toBe('EGP 100')
    expect(formatBalance(15050, 'EGP', 'en')).toBe('EGP 150.5')
    expect(formatBalance(50, 'EGP', 'en')).toBe('EGP 0.5')
    expect(formatBalance(0, 'EGP', 'en')).toBe('EGP 0')
    expect(formatBalance(500000, 'EGP', 'en')).toBe('EGP 5,000')
  })

  it('writes Arabic as the amount then the symbol, Western digits, no marks', () => {
    const value = formatBalance(15050, 'EGP', 'ar')
    expect(value).toBe('150.5 ج.م')
    expect(value).not.toMatch(bidiMarks)
    expect(formatBalance(10000, 'EGP', 'ar')).toBe('100 ج.م')
  })

  it('follows each language and never uses non-Latin digits', () => {
    expect(formatBalance(15050, 'EGP', 'ur')).toBe('EGP 150.5')
    expect(formatBalance(125050, 'EGP', 'es')).toBe('EGP 1,250.5')
    expect(formatBalance(15050, 'EGP', 'fr').replace(/\s/g, ' ')).toBe(
      '150,5 EGP'
    )
    expect(formatBalance(15050, 'EGP', 'tr')).toMatch(/150,5/)
    for (const locale of ['ar', 'en', 'ur', 'es', 'fr', 'tr'] as const)
      expect(formatBalance(15050, 'EGP', locale)).not.toMatch(/[٠-٩۰-۹]/)
  })

  it('keeps two decimals when asked, for exact receipts', () => {
    expect(formatBalance(10000, 'EGP', 'en', { fixed: true })).toBe(
      'EGP 100.00'
    )
    expect(formatBalance(10000, 'EGP', 'ar', { fixed: true })).toBe(
      '100.00 ج.م'
    )
  })
})

describe('formatBalanceParts', () => {
  it('splits the amount from the currency and says which comes first', () => {
    expect(formatBalanceParts(15050, 'EGP', 'en')).toEqual({
      amount: '150.5',
      currency: 'EGP',
      currencyFirst: true,
    })
    expect(formatBalanceParts(15050, 'EGP', 'ar')).toEqual({
      amount: '150.5',
      currency: 'ج.م',
      currencyFirst: false,
    })
    expect(formatBalanceParts(500000, 'EGP', 'fr').currencyFirst).toBe(false)
  })
})
