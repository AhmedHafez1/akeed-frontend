import { describe, expect, it } from 'vitest'
import { countryChange } from './mappingForm'

describe('countryChange', () => {
  it("brings the new country's currency along with the country", () => {
    expect(countryChange({ country: 'SA', currency: 'SAR' }, 'EG')).toEqual({
      country: 'EG',
      currency: 'EGP',
    })
  })

  it('replaces the USD placeholder default', () => {
    expect(countryChange({ country: 'EG', currency: 'USD' }, 'EG')).toEqual({
      country: 'EG',
      currency: 'EGP',
    })
  })

  it("keeps a currency the merchant chose over the country's", () => {
    expect(countryChange({ country: 'EG', currency: 'EUR' }, 'SA')).toEqual({
      country: 'SA',
    })
  })

  it('keeps the currency for a country without a known one', () => {
    expect(countryChange({ country: 'EG', currency: 'EGP' }, 'FR')).toEqual({
      country: 'FR',
    })
  })
})
