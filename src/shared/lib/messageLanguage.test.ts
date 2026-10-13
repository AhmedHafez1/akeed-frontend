import { describe, expect, it } from 'vitest'
import {
  getMessageLanguageDirection,
  getMessagePreviewTimestamp,
  isMessageLanguage,
  MESSAGE_LANGUAGES,
  MESSAGE_SAMPLE_CUSTOMER_NAMES,
} from './messageLanguage'

describe('message languages', () => {
  it('lists Arabic and English first, then the newer languages', () => {
    expect(MESSAGE_LANGUAGES).toEqual(['ar', 'en', 'ur', 'es', 'fr'])
  })

  it('writes Arabic and Urdu right to left, the others left to right', () => {
    expect(MESSAGE_LANGUAGES.map(getMessageLanguageDirection)).toEqual([
      'rtl',
      'ltr',
      'rtl',
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
