import { describe, expect, it } from 'vitest'
import {
  customerDisplayName,
  formatCount,
  formatOrderAmount,
  formatOrderNumber,
  formatPercent,
  formatPhoneInternational,
  formatUpdatedAt,
  shopifyOrderAdminUrl,
  whatsAppChatUrl,
} from './orderDisplay'

const BIDI = new RegExp(
  `[${String.fromCharCode(0x200e, 0x200f, 0x061c, 0x202a, 0x202b, 0x202c)}]`
)

describe('formatOrderAmount', () => {
  it('puts the symbol first with Latin digits and no bidi marks in Arabic', () => {
    const value = formatOrderAmount('2629.95', 'USD', 'ar')
    expect(value).toBe('US$ 2,629.95')
    expect(value).not.toMatch(BIDI)
  })

  it('uses the English currency format in English', () => {
    expect(formatOrderAmount('2629.95', 'USD', 'en')).toBe('$2,629.95')
    expect(formatOrderAmount(49.95, 'EGP', 'en')).toBe('EGP 49.95')
  })

  it('shows a dash for a missing or broken amount', () => {
    expect(formatOrderAmount(null, 'USD', 'ar')).toBe('—')
    expect(formatOrderAmount('', 'USD', 'en')).toBe('—')
    expect(formatOrderAmount('abc', 'USD', 'en')).toBe('—')
  })

  it('never throws on an unknown currency code', () => {
    expect(formatOrderAmount('10', 'NOPE1', 'en')).toBe('NOPE1 10.00')
  })
})

describe('counts and percentages', () => {
  it('keep Latin digits in Arabic', () => {
    expect(formatCount(1234, 'ar')).toBe('1,234')
    expect(formatPercent(68, 'ar')).toBe('68%')
  })

  it('read a missing rate as a dash, not 0%', () => {
    expect(formatPercent(null, 'en')).toBe('—')
    expect(formatPercent(67.9, 'en')).toBe('68%')
  })
})

describe('formatPhoneInternational', () => {
  it('groups Egyptian mobiles the way merchants write them', () => {
    expect(formatPhoneInternational('+201007611456')).toBe('+20 100 761 1456')
    expect(formatPhoneInternational('201148675077')).toBe('+20 114 867 5077')
  })

  it('uses the international format elsewhere', () => {
    expect(formatPhoneInternational('+966501234567')).toBe('+966 50 123 4567')
  })

  it('returns what it cannot parse unchanged', () => {
    expect(formatPhoneInternational('12')).toBe('12')
    expect(formatPhoneInternational(null)).toBe('')
  })
})

describe('links', () => {
  it('builds a wa.me link from the digits only', () => {
    expect(whatsAppChatUrl('+20 100 761 1456')).toBe(
      'https://wa.me/201007611456'
    )
    expect(whatsAppChatUrl('123')).toBeNull()
    expect(whatsAppChatUrl(null)).toBeNull()
  })

  it('links only Shopify orders with a numeric id', () => {
    expect(shopifyOrderAdminUrl('shopify', '5551234')).toBe(
      'shopify://admin/orders/5551234'
    )
    expect(shopifyOrderAdminUrl('standalone', '5551234')).toBeNull()
    expect(shopifyOrderAdminUrl('shopify', 'akeed-test-1')).toBeNull()
    expect(shopifyOrderAdminUrl('shopify', null)).toBeNull()
  })
})

describe('names and numbers', () => {
  it('prefixes the order number once', () => {
    expect(formatOrderNumber('1138')).toBe('#1138')
    expect(formatOrderNumber('#1138')).toBe('#1138')
    expect(formatOrderNumber(null)).toBeNull()
  })

  it('treats a missing or placeholder name as no name', () => {
    expect(customerDisplayName('Abdelghany Hafez')).toBe('Abdelghany Hafez')
    expect(customerDisplayName('Guest')).toBeNull()
    expect(customerDisplayName('  ')).toBeNull()
    expect(customerDisplayName(null)).toBeNull()
  })
})

describe('formatUpdatedAt', () => {
  it('shows day, month and time in the reporting zone', () => {
    expect(formatUpdatedAt('2026-09-22T17:58:00Z', 'en', 'UTC')).toBe(
      'Sep 22, 5:58 PM'
    )
    const arabic = formatUpdatedAt('2026-09-22T17:58:00Z', 'ar', 'UTC')
    expect(arabic).toContain('22 سبتمبر')
    expect(arabic).toContain('5:58')
  })

  it('shows a dash when there is no date', () => {
    expect(formatUpdatedAt(null, 'en', 'UTC')).toBe('—')
  })
})
