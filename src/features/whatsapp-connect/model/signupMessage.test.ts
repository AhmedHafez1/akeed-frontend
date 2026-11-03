import { describe, expect, it } from 'vitest'
import { isTrustedFacebookOrigin, parseSignupMessage } from './signupMessage'

describe('isTrustedFacebookOrigin', () => {
  it.each([
    'https://www.facebook.com',
    'https://web.facebook.com',
    'https://business.facebook.com',
  ])('trusts %s', (origin) => {
    expect(isTrustedFacebookOrigin(origin)).toBe(true)
  })

  it.each([
    'https://evilfacebook.com',
    'https://facebook.com.evil.io',
    'https://www.facebook.com.evil.io',
    'https://evil.io/www.facebook.com',
    'http://www.facebook.com',
    'https://www.facebook.com:8443',
    'https://user@www.facebook.com',
    'https://www.facebook.com/',
    'https://m.facebook.com',
    'https://akeed.facebook.com',
    'null',
    '',
    undefined,
    42,
  ])('refuses %s', (origin) => {
    expect(isTrustedFacebookOrigin(origin)).toBe(false)
  })
})

describe('parseSignupMessage', () => {
  // The one full v5 sample Meta publishes, for a WhatsApp Business app number.
  const v5BusinessApp = {
    data: {
      phone_number_id: '106540352242922',
      is_on_biz_app: true,
      messaging_account_ids: ['102290129340398'],
      primary_waac_ids: [],
      business_id: '2729063490586005',
      page_ids: [],
      catalog_ids: [],
      dataset_ids: [],
      instagram_account_ids: [],
    },
    type: 'WA_EMBEDDED_SIGNUP',
    event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  }

  it('reads a v5 session sent as a JSON string, as Meta documents', () => {
    expect(parseSignupMessage(JSON.stringify(v5BusinessApp))).toEqual({
      kind: 'finish',
      hints: {
        wabaIds: ['102290129340398'],
        phoneNumberId: '106540352242922',
        isOnBusinessApp: true,
      },
    })
  })

  it('reads a v5 new-number finish sent as an object', () => {
    expect(
      parseSignupMessage({
        ...v5BusinessApp,
        event: 'FINISH',
        data: { ...v5BusinessApp.data, is_on_biz_app: false },
      })
    ).toMatchObject({ hints: { isOnBusinessApp: false } })
  })

  it('still reads the v4 fields', () => {
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH',
        data: {
          phone_number_id: '106540352242922',
          waba_id: '102290129340398',
          business_id: '2729063490586005',
        },
      })
    ).toEqual({
      kind: 'finish',
      hints: {
        wabaIds: ['102290129340398'],
        phoneNumberId: '106540352242922',
        isOnBusinessApp: null,
      },
    })
  })

  it('treats the Business app event as the Business app without the v5 flag', () => {
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
        data: { waba_id: '1', phone_number_id: '2' },
      })
    ).toMatchObject({ hints: { isOnBusinessApp: true } })
  })

  it('keeps several accounts so the server can refuse to guess', () => {
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH',
        data: { waba_ids: ['1', '2'], messaging_account_ids: ['2', '3'] },
      })
    ).toMatchObject({ hints: { wabaIds: ['2', '3', '1'] } })
  })

  it('drops ids that are not Meta ids', () => {
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH',
        data: {
          messaging_account_ids: ['../me', '1 OR 1', 7],
          phone_number_id: 'abc',
        },
      })
    ).toEqual({
      kind: 'finish',
      hints: { wabaIds: ['7'], phoneNumberId: null, isOnBusinessApp: null },
    })
  })

  it('reads cancel and error, with the error code as a string or number', () => {
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'CANCEL',
        data: { current_step: 'PHONE_NUMBER_SETUP' },
      })
    ).toEqual({ kind: 'cancel' })
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'ERROR',
        data: {
          error_message: '<b>raw</b>',
          error_code: '2655093',
          session_id: 'x',
          timestamp: '1700000000000',
        },
      })
    ).toEqual({ kind: 'error', errorCode: '2655093' })
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'ERROR',
        data: { error_code: 4563015 },
      })
    ).toEqual({ kind: 'error', errorCode: '4563015' })
    expect(
      parseSignupMessage({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'ERROR',
        data: { error_code: 'not-a-code' },
      })
    ).toEqual({ kind: 'error', errorCode: null })
  })

  it.each([
    null,
    undefined,
    42,
    '',
    '{not json',
    '[]',
    JSON.stringify({ type: 'OTHER', event: 'FINISH' }),
    { type: 'WA_EMBEDDED_SIGNUP' },
    { type: 'WA_EMBEDDED_SIGNUP', event: 'SOMETHING_NEW' },
    'x'.repeat(20_000),
  ])('ignores %s', (data) => {
    expect(parseSignupMessage(data)).toBeNull()
  })
})
