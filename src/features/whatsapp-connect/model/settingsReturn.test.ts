import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  forgetSettingsReturn,
  readSettingsReturn,
  rememberSettingsReturn,
} from './settingsReturn'

const future = () => new Date(Date.now() + 60_000).toISOString()
beforeEach(() => sessionStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('public settings return destination', () => {
  it.each([
    'https://app.example.test/ar/settings',
    'https://example-store.myshopify.com/admin/apps/akeed/ar/settings',
    'http://localhost:3001/ar/settings',
  ])('preserves the trusted destination and locale: %s', (url) => {
    expect(rememberSettingsReturn(url, future(), 'ar')).toBe(
      url + '?tab=whatsapp'
    )
    expect(readSettingsReturn('ar')).toBe(url + '?tab=whatsapp')
    expect(readSettingsReturn('en')).toBeNull()
    forgetSettingsReturn()
    expect(readSettingsReturn('ar')).toBeNull()
  })
  it('never persists auth codes, tickets, host parameters or fragments', () => {
    const url = rememberSettingsReturn(
      'https://app.example.test/en/settings?ticket=SECRET&code=CODE&host=HOST#token',
      future(),
      'en'
    )
    expect(url).toBe('https://app.example.test/en/settings?tab=whatsapp')
    expect(
      sessionStorage.getItem('akeed:whatsapp-settings-return')
    ).not.toMatch(/SECRET|CODE|HOST|token/)
  })
  it.each([
    'javascript:alert(1)',
    'http://app.example.test/en/settings',
    'https://user:password@app.example.test/en/settings',
    'https://app.example.test/en/orders',
    'https://example-store.myshopify.com.evil.test/admin/apps/akeed/en/settings',
    'https://app.example.test/ar/settings',
  ])('rejects an unusable destination: %s', (value) => {
    expect(rememberSettingsReturn(value, future(), 'en')).toBeNull()
    expect(readSettingsReturn('en')).toBeNull()
  })
  it('rejects expired, malformed and invalid stored data', () => {
    rememberSettingsReturn(
      'https://app.example.test/en/settings',
      new Date(Date.now() - 1).toISOString(),
      'en'
    )
    expect(readSettingsReturn('en')).toBeNull()
    for (const value of [
      '{',
      'null',
      '{"url":"javascript:alert(1)"}',
      '"value"',
    ]) {
      sessionStorage.setItem('akeed:whatsapp-settings-return', value)
      expect(readSettingsReturn('en')).toBeNull()
    }
  })
  it('keeps the immediate link usable when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Unavailable')
    })
    expect(
      rememberSettingsReturn(
        'https://app.example.test/en/settings',
        future(),
        'en'
      )
    ).toBe('https://app.example.test/en/settings?tab=whatsapp')
  })
})
