import { describe, expect, it } from 'vitest'
import { countryName } from './country'

describe('countryName', () => {
  it('names a region code', () => {
    expect(countryName('GT')).toBe('Guatemala')
    expect(countryName('sa')).toBe('Saudi Arabia')
  })

  it('returns null for missing or malformed codes', () => {
    expect(countryName(null)).toBeNull()
    expect(countryName('')).toBeNull()
    expect(countryName('GTM')).toBeNull()
  })
})
