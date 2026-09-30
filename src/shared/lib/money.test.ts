import { describe, expect, it } from 'vitest'
import { formatAmount } from './money'

const LRM = String.fromCharCode(0x200e)
const bidiMarks = new RegExp(`[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`)

describe('formatAmount', () => {
  it('writes the Arabic symbol first left to right, so it reads after the amount', () => {
    expect(formatAmount(500, 'EGP', 'ar')).toBe(`ج.م${LRM} 500.00`)
    expect(formatAmount(1250.5, 'SAR', 'ar')).toBe(`ر.س${LRM} 1,250.50`)
  })

  it('never produces the reordered `$US` form', () => {
    const value = formatAmount(500, 'USD', 'ar')
    expect(value).toBe('US$ 500.00')
    expect(value).not.toMatch(bidiMarks)
  })

  it('keeps the English convention', () => {
    expect(formatAmount(500, 'USD', 'en')).toBe('$500.00')
    expect(formatAmount(500, 'EGP', 'en')).toBe('EGP 500.00')
  })

  it('carries no bidi marks except the anchor after an Arabic symbol', () => {
    for (const currency of ['EGP', 'SAR', 'AED', 'USD'])
      expect(formatAmount(99.5, currency, 'en')).not.toMatch(bidiMarks)
    expect(formatAmount(99.5, 'USD', 'ar')).not.toMatch(bidiMarks)
    expect(formatAmount(99.5, 'EGP', 'ar').split(LRM)).toHaveLength(2)
  })
})
