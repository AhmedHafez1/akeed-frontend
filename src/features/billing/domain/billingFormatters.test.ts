import { describe, expect, it } from 'vitest'
import { formatMoney, formatShortDate } from './billingFormatters'

const BIDI_MARK = new RegExp(`[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`)
const ARABIC_INDIC_DIGIT = new RegExp(
  `[${String.fromCharCode(0x0660)}-${String.fromCharCode(0x0669)}]`
)

describe('formatMoney', () => {
  it('writes Arabic amounts first, then the currency without its dot', () => {
    expect(formatMoney(100_000, 'EGP', 'ar')).toBe('1,000.00 ج.م')
    expect(formatMoney(200, 'EGP', 'ar')).toBe('2.00 ج.م')
  })

  it('writes English amounts after the currency code', () => {
    expect(formatMoney(100_000, 'EGP', 'en')).toBe('EGP 1,000.00')
    expect(formatMoney(200, 'EGP', 'en')).toBe('EGP 2.00')
  })

  it('uses Western digits and no bidi marks in either locale', () => {
    for (const locale of ['ar', 'en'] as const) {
      const text = formatMoney(1_234_550, 'EGP', locale)
      expect(text).toContain('12,345.50')
      expect(text).not.toMatch(BIDI_MARK)
      expect(text).not.toMatch(ARABIC_INDIC_DIGIT)
    }
  })
})

describe('formatShortDate', () => {
  const now = new Date(2026, 9, 1, 12)
  const september = new Date(2026, 8, 12, 12).toISOString()

  it('is the day and month within the current year', () => {
    expect(formatShortDate(september, 'ar', now)).toBe('12 سبتمبر')
    expect(formatShortDate(september, 'en', now)).toBe('Sep 12')
  })

  it('adds the year when it is not this one', () => {
    const lastYear = new Date(2025, 8, 12, 12).toISOString()
    expect(formatShortDate(lastYear, 'ar', now)).toBe('12 سبتمبر 2025')
    expect(formatShortDate(lastYear, 'en', now)).toBe('Sep 12, 2025')
  })
})
