import { describe, expect, it } from 'vitest'
import {
  getMessageLanguageDirection,
  getMessagePreviewTimestamp,
  isMessageLanguage,
  MESSAGE_LANGUAGES,
  MESSAGE_SAMPLE_CUSTOMER_NAMES,
  formatMessageTotal,
} from './messageLanguage'

describe('message languages', () => {
  it('lists Arabic and English first, then the newer languages', () => {
    expect(MESSAGE_LANGUAGES).toEqual(['ar', 'en', 'ur', 'es', 'fr', 'tr'])
  })

  it('writes Arabic and Urdu right to left, the others left to right', () => {
    expect(MESSAGE_LANGUAGES.map(getMessageLanguageDirection)).toEqual([
      'rtl',
      'ltr',
      'rtl',
      'ltr',
      'ltr',
      'ltr',
    ])
  })

  it('accepts only a message language, never "auto"', () => {
    expect(isMessageLanguage('ur')).toBe(true)
    expect(isMessageLanguage('auto')).toBe(false)
    expect(isMessageLanguage('de')).toBe(false)
    expect(isMessageLanguage(null)).toBe(false)
  })

  it('has a sample customer and a preview time for every language', () => {
    for (const language of MESSAGE_LANGUAGES) {
      expect(MESSAGE_SAMPLE_CUSTOMER_NAMES[language]).toBeTruthy()
      expect(getMessagePreviewTimestamp(language)).toContain('08')
    }
  })
})

// The cases of the backend's `formatOrderTotal`, which this mirrors.
describe('formatMessageTotal', () => {
  it('writes the total as each language sends it', () => {
    expect(formatMessageTotal('1250.00', 'EGP', 'ar')).toBe('1,250.00 ج.م')
    expect(formatMessageTotal('1250.00', 'EGP', 'en')).toBe('EGP 1,250.00')
    for (const language of ['ur', 'es', 'fr', 'tr'] as const) {
      expect(formatMessageTotal('1250.00', 'EUR', language)).toBe(
        '1,250.00 EUR'
      )
    }
    expect(formatMessageTotal(599, 'USD', 'ar')).toBe('599.00 $')
  })

  it('writes a currency Arabic has no word for with its code', () => {
    expect(formatMessageTotal('1250.00', 'XYZ', 'ar')).toBe('1,250.00 XYZ')
    expect(formatMessageTotal('99.5', 'JOD', 'ar')).toBe('99.500 JOD')
  })

  it('shows the minor units of the currency and never rounds', () => {
    expect(formatMessageTotal('1250', 'egp', 'en')).toBe('EGP 1,250.00')
    expect(formatMessageTotal(1250.5, 'SAR', 'en')).toBe('SAR 1,250.50')
    expect(formatMessageTotal('0.5', 'USD', 'en')).toBe('USD 0.50')
    expect(formatMessageTotal('1234567.89', 'EGP', 'en')).toBe(
      'EGP 1,234,567.89'
    )
    expect(formatMessageTotal('1250.000', 'EGP', 'en')).toBe('EGP 1,250.00')
    expect(formatMessageTotal('1250.005', 'EGP', 'en')).toBe('EGP 1,250.005')
    expect(formatMessageTotal('1250.99', 'JPY', 'en')).toBe('JPY 1,250.99')
    expect(formatMessageTotal('1250.00', 'JPY', 'en')).toBe('JPY 1,250')
  })

  it('sends the number alone without a currency, and odd values as they are', () => {
    expect(formatMessageTotal('1250.00', '', 'ar')).toBe('1,250.00')
    expect(formatMessageTotal('1250.00', null, 'en')).toBe('1,250.00')
    expect(formatMessageTotal('-5.00', 'EGP', 'en')).toBe('-5.00 EGP')
    expect(formatMessageTotal('1250.00', 'Egyptian pound', 'en')).toBe(
      '1250.00 Egyptian pound'
    )
  })
})
