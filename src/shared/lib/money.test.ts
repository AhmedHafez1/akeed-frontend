import { describe, expect, it } from 'vitest'
import { formatAmount } from './money'

const bidiMarks = new RegExp(`[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`)

describe('formatAmount', () => {
  it('writes the Arabic amount first, then the currency, in Latin digits', () => {
    expect(formatAmount(500, 'EGP', 'ar')).toBe('500.00 ج.م')
    expect(formatAmount(1250.5, 'SAR', 'ar')).toBe('1,250.50 ر.س')
  })

  it('never produces the reordered `$US` form', () => {
    const value = formatAmount(500, 'USD', 'ar')
    expect(value).toBe('500.00 US$')
    expect(value).not.toMatch(bidiMarks)
  })

  it('keeps the English convention', () => {
    expect(formatAmount(500, 'USD', 'en')).toBe('$500.00')
    expect(formatAmount(500, 'EGP', 'en')).toBe('EGP 500.00')
  })

  it('carries no bidi marks in either locale', () => {
    for (const locale of ['ar', 'en'] as const)
      for (const currency of ['EGP', 'SAR', 'AED', 'USD'])
        expect(formatAmount(99.5, currency, locale)).not.toMatch(bidiMarks)
  })
})
