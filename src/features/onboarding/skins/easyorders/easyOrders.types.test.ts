import { describe, expect, it } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import {
  EASYORDERS_ERROR_CODES,
  toEasyOrdersErrorKey,
} from './easyOrders.types'

function leafKeys(value: unknown, path = ''): string[] {
  if (value === null || typeof value !== 'object') return [path]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, path ? `${path}.${key}` : key)
  )
}

const locales = { ar, en }

describe('EasyOrders messages (US-06-06)', () => {
  it.each(Object.entries(locales))(
    '%s has a message for every error code the screen names, and a default',
    (_locale, messages) => {
      const codes: Record<string, string> =
        messages.easyOrdersConnect.error.codes

      for (const code of [...EASYORDERS_ERROR_CODES, 'default'])
        expect(codes[code]?.trim(), code).toBeTruthy()
      expect(Object.keys(codes).sort()).toEqual(
        [...EASYORDERS_ERROR_CODES, 'default'].sort()
      )
    }
  )

  it('gives Arabic and English the same EasyOrders keys', () => {
    expect(leafKeys(ar.easyOrdersConnect).sort()).toEqual(
      leafKeys(en.easyOrdersConnect).sort()
    )
  })

  it('shows the localized default for a code the screen does not name', () => {
    // Codes EasyOrders or its webhooks receive, never the merchant's screen.
    for (const code of [
      'EASYORDERS_WEBHOOK_UNAUTHORIZED',
      'EASYORDERS_INSTALL_CONTEXT_INVALID',
      'SOMETHING_NEW',
      null,
      undefined,
    ])
      expect(toEasyOrdersErrorKey(code)).toBe('default')
  })

  it('never translates the Arabic messages by leaving them in English', () => {
    const arabic = ar.easyOrdersConnect.error.codes as Record<string, string>
    const english = en.easyOrdersConnect.error.codes as Record<string, string>

    for (const code of [...EASYORDERS_ERROR_CODES, 'default'])
      expect(arabic[code], code).not.toBe(english[code])
  })
})
