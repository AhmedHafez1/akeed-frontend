import { describe, expect, it } from 'vitest'
import {
  buildStoreSettingsPayload,
  countryFromLanguages,
  currencyLabel,
  firstInvalidField,
  formatPhoneForDisplay,
  parseStandaloneStep,
  phoneFormatHint,
  previewLanguageFor,
  resolveStandaloneStep,
  STANDALONE_SETTINGS_DEFAULTS,
  validateStoreForm,
  type StandaloneStoreForm,
} from './standaloneStore'

const strip = (value: string) => value.replace(/[⁦⁩]/g, '')

const form: StandaloneStoreForm = {
  storeName: '  Noor Store ',
  phone: '+201012345670',
  phoneCountry: 'EG',
  language: 'auto',
  currency: 'EGP',
  timezone: 'Africa/Cairo',
}

const messages = {
  storeNameRequired: 'name required',
  phoneInvalid: ({
    digits,
    code,
    example,
  }: {
    digits: number
    code: string
    example: string
  }) => `phone ${digits} ${strip(code)} ${strip(example)}`,
}

describe('parseStandaloneStep', () => {
  it('accepts the three steps and nothing else', () => {
    expect(parseStandaloneStep('store')).toBe('store')
    expect(parseStandaloneStep('test')).toBe('test')
    expect(parseStandaloneStep('done')).toBe('done')
    expect(parseStandaloneStep('review')).toBeNull()
    expect(parseStandaloneStep(null)).toBeNull()
  })
})

describe('resolveStandaloneStep', () => {
  it('always starts at store while no number is saved', () => {
    for (const requested of ['store', 'test', 'done', null] as const) {
      expect(
        resolveStandaloneStep({ merchantWhatsappPhone: null }, requested)
      ).toBe('store')
    }
  })

  it('resumes the test once a number is saved, unless store is asked for', () => {
    const saved = { merchantWhatsappPhone: '+201012345670' }
    expect(resolveStandaloneStep(saved, null)).toBe('test')
    expect(resolveStandaloneStep(saved, 'test')).toBe('test')
    expect(resolveStandaloneStep(saved, 'store')).toBe('store')
    // "done" only exists right after /complete; a pending account resumes.
    expect(resolveStandaloneStep(saved, 'done')).toBe('test')
  })
})

describe('countryFromLanguages', () => {
  it('takes the region of the first served browser language', () => {
    expect(countryFromLanguages(['ar-SA', 'en-US'])).toBe('SA')
    expect(countryFromLanguages(['en', 'ar-AE'])).toBe('AE')
  })

  it('falls back to Egypt', () => {
    expect(countryFromLanguages(['ar'])).toBe('EG')
    expect(countryFromLanguages([])).toBe('EG')
    expect(countryFromLanguages(['he-IL'])).toBe('EG')
  })
})

describe('phoneFormatHint', () => {
  it('says how many digits follow the calling code, with an example', () => {
    const hint = phoneFormatHint('EG')
    expect(hint.digits).toBe(10)
    expect(strip(hint.code)).toBe('+20')
    expect(strip(hint.example).replace(/\s/g, '')).toMatch(/^1\d{9}$/)
  })

  it('groups the example the way people write it', () => {
    expect(strip(phoneFormatHint('EG').example)).toBe('100 123 4567')
    expect(strip(phoneFormatHint('SA').example)).toBe('51 234 5678')
  })

  it('isolates the left-to-right tokens for Arabic copy', () => {
    expect(phoneFormatHint('SA').code).toBe('⁦+966⁩')
  })
})

describe('formatPhoneForDisplay', () => {
  it('spaces a saved number for reading', () => {
    expect(formatPhoneForDisplay('+201012345670')).toBe('+20 101 234 5670')
    expect(formatPhoneForDisplay('not a number')).toBe('not a number')
  })
})

describe('validateStoreForm', () => {
  it('accepts a named store with a valid number', () => {
    expect(validateStoreForm(form, messages)).toEqual({})
  })

  it('asks for the store name when it is blank', () => {
    const errors = validateStoreForm({ ...form, storeName: '  ' }, messages)
    expect(errors.storeName).toBe('name required')
    expect(firstInvalidField(errors)).toBe('storeName')
  })

  it('explains an incomplete number for its own country', () => {
    const errors = validateStoreForm({ ...form, phone: '+20101234' }, messages)
    expect(errors.merchantWhatsappPhone).toMatch(/^phone 10 \+20 /)
    expect(firstInvalidField(errors)).toBe('merchantWhatsappPhone')
  })

  it('uses the picked country while the number is empty', () => {
    const errors = validateStoreForm(
      { ...form, phone: '', phoneCountry: 'SA' },
      messages
    )
    expect(errors.merchantWhatsappPhone).toMatch(/^phone 9 \+966 /)
  })

  it('reports the store name first when both are invalid', () => {
    const errors = validateStoreForm(
      { ...form, storeName: '', phone: '' },
      messages
    )
    expect(firstInvalidField(errors)).toBe('storeName')
  })
})

describe('buildStoreSettingsPayload', () => {
  it('sends the form plus the standalone defaults, auto-verify on', () => {
    expect(buildStoreSettingsPayload(form)).toEqual({
      storeName: 'Noor Store',
      merchantWhatsappPhone: '+201012345670',
      defaultLanguage: 'auto',
      shippingCurrency: 'EGP',
      timezone: 'Africa/Cairo',
      ...STANDALONE_SETTINGS_DEFAULTS,
    })
    expect(STANDALONE_SETTINGS_DEFAULTS).toMatchObject({
      isAutoVerifyEnabled: true,
      sendDelayMinutes: 0,
      followUpEnabled: true,
      followUpDelayMinutes: 120,
      escalationEnabled: true,
      escalationDelayMinutes: 360,
      quietHoursEnabled: false,
      assumeCodWhenPaymentMissing: false,
    })
  })
})

describe('previewLanguageFor', () => {
  it('follows a fixed language', () => {
    expect(previewLanguageFor({ ...form, language: 'en' })).toBe('en')
  })

  it('under auto, follows the number (or picked country)', () => {
    expect(previewLanguageFor(form)).toBe('ar')
    expect(
      previewLanguageFor({
        ...form,
        phone: '+447911123456',
        phoneCountry: 'GB',
      })
    ).toBe('en')
    expect(previewLanguageFor({ ...form, phone: '', phoneCountry: 'US' })).toBe(
      'en'
    )
  })
})

describe('currencyLabel', () => {
  it('names the currency with its symbol', () => {
    expect(currencyLabel('EGP', 'en')).toBe('Egyptian Pound (EGP)')
    expect(currencyLabel('EGP', 'ar')).toBe('جنيه مصري (ج.م)')
  })
})
