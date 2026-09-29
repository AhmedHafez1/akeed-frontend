import { describe, expect, it } from 'vitest'
import { inferRegionalDefaults } from './regionalDefaults'

describe('inferRegionalDefaults', () => {
  const cases: Array<{
    country: string
    phoneE164: string
    currency: string
    timezone: string
  }> = [
    {
      country: 'EG',
      phoneE164: '+201007611456',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
    },
    {
      country: 'SA',
      phoneE164: '+966501234567',
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
    },
    {
      country: 'AE',
      phoneE164: '+971501234567',
      currency: 'AED',
      timezone: 'Asia/Dubai',
    },
    {
      country: 'QA',
      phoneE164: '+97433123456',
      currency: 'QAR',
      timezone: 'Asia/Qatar',
    },
    {
      country: 'KW',
      phoneE164: '+96550123456',
      currency: 'KWD',
      timezone: 'Asia/Kuwait',
    },
    {
      country: 'BH',
      phoneE164: '+97336123456',
      currency: 'BHD',
      timezone: 'Asia/Bahrain',
    },
    {
      country: 'OM',
      phoneE164: '+96892123456',
      currency: 'OMR',
      timezone: 'Asia/Muscat',
    },
    {
      country: 'JO',
      phoneE164: '+962791234567',
      currency: 'JOD',
      timezone: 'Asia/Amman',
    },
    {
      country: 'MA',
      phoneE164: '+212612345678',
      currency: 'MAD',
      timezone: 'Africa/Casablanca',
    },
  ]

  it.each(cases)(
    'infers $currency and $timezone from a $country phone number',
    ({ country, phoneE164, currency, timezone }) => {
      const result = inferRegionalDefaults({ phoneE164 })
      expect(result.country).toBe(country)
      expect(result.currency).toBe(currency)
      expect(result.timezone).toBe(timezone)
    }
  )

  it('falls back to USD for a country outside the manual-order allowlist', () => {
    const result = inferRegionalDefaults({ phoneE164: '+14155552671' })
    expect(result.country).toBe('US')
    expect(result.currency).toBe('USD')
  })

  it('uses the browser timezone when no phone is given', () => {
    const result = inferRegionalDefaults({ browserTimeZone: 'Asia/Dubai' })
    expect(result.country).toBeUndefined()
    expect(result.currency).toBe('USD')
    expect(result.timezone).toBe('Asia/Dubai')
  })

  it('prefers a curated browser timezone over the phone country zone', () => {
    const result = inferRegionalDefaults({
      phoneE164: '+201007611456',
      browserTimeZone: 'Asia/Dubai',
    })
    expect(result.timezone).toBe('Asia/Dubai')
  })

  it('falls back to the phone country zone when the browser timezone is not curated', () => {
    const result = inferRegionalDefaults({
      phoneE164: '+201007611456',
      browserTimeZone: 'America/New_York',
    })
    expect(result.timezone).toBe('Africa/Cairo')
  })

  it('falls back to Asia/Riyadh with no phone and no curated browser timezone', () => {
    const result = inferRegionalDefaults({
      browserTimeZone: 'America/New_York',
    })
    expect(result.country).toBeUndefined()
    expect(result.currency).toBe('USD')
    expect(result.timezone).toBe('Asia/Riyadh')
  })

  it('falls back to Asia/Riyadh with nothing given at all', () => {
    const result = inferRegionalDefaults({})
    expect(result.country).toBeUndefined()
    expect(result.currency).toBe('USD')
    expect(result.timezone).toBe('Asia/Riyadh')
  })

  it('does not throw on an unparseable phone number', () => {
    const result = inferRegionalDefaults({ phoneE164: 'not-a-phone-number' })
    expect(result.country).toBeUndefined()
    expect(result.currency).toBe('USD')
    expect(result.timezone).toBe('Asia/Riyadh')
  })

  it('uses the country hint while the number is blank or unparseable', () => {
    expect(inferRegionalDefaults({ countryHint: 'ae' })).toMatchObject({
      country: 'AE',
      currency: 'AED',
      timezone: 'Asia/Dubai',
    })
    expect(
      inferRegionalDefaults({ phoneE164: '+2', countryHint: 'EG' }).currency
    ).toBe('EGP')
  })

  it('prefers the number over the hint', () => {
    expect(
      inferRegionalDefaults({ phoneE164: '+966512345678', countryHint: 'EG' })
        .currency
    ).toBe('SAR')
  })
})
