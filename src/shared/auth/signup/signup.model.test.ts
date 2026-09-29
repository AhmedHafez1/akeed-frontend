import { describe, expect, it } from 'vitest'
import {
  buildSentSearch,
  firstInvalidField,
  mapSignUpError,
  readSentEmail,
  toSignupMetadata,
  validateSignup,
  type SignupValues,
} from './signup.model'

const valid: SignupValues = {
  fullName: 'أحمد حافظ',
  storeName: 'متجر نور',
  email: 'ahmed@noorstore.com',
  password: '12345678',
  terms: true,
}

describe('validateSignup', () => {
  it('accepts a complete form', () => {
    expect(validateSignup(valid)).toEqual({})
  })

  it('requires every field and the terms', () => {
    expect(
      validateSignup({
        fullName: ' ',
        storeName: '',
        email: '',
        password: '',
        terms: false,
      })
    ).toEqual({
      fullName: 'fullNameRequired',
      storeName: 'storeNameRequired',
      email: 'emailRequired',
      password: 'passwordTooShort',
      terms: 'termsRequired',
    })
  })

  it('rejects a malformed email', () => {
    expect(validateSignup({ ...valid, email: 'ahmed@store' }).email).toBe(
      'emailInvalid'
    )
  })

  it('needs at least 8 password characters', () => {
    expect(validateSignup({ ...valid, password: '1234567' }).password).toBe(
      'passwordTooShort'
    )
    expect(validateSignup({ ...valid, password: '12345678' }).password).toBe(
      undefined
    )
  })

  it('has no confirm-password rule', () => {
    expect(Object.keys(validateSignup(valid))).toHaveLength(0)
  })
})

describe('firstInvalidField', () => {
  it('follows the form order', () => {
    expect(
      firstInvalidField({ terms: 'termsRequired', email: 'emailInvalid' })
    ).toBe('email')
    expect(firstInvalidField({})).toBeNull()
  })
})

describe('mapSignUpError', () => {
  it('puts an already-registered email on the email field', () => {
    expect(mapSignUpError({ code: 'user_already_exists' })).toEqual({
      kind: 'field',
      field: 'email',
      error: 'emailRegistered',
    })
  })

  it('maps weak passwords, invalid emails and rate limits', () => {
    expect(mapSignUpError({ code: 'weak_password' })).toMatchObject({
      field: 'password',
    })
    expect(mapSignUpError({ code: 'email_address_invalid' })).toMatchObject({
      field: 'email',
      error: 'emailInvalid',
    })
    expect(mapSignUpError({ code: 'over_email_send_rate_limit' })).toEqual({
      kind: 'form',
      error: 'rateLimited',
    })
    expect(mapSignUpError(new Error('network'))).toEqual({
      kind: 'form',
      error: 'failed',
    })
  })
})

describe('toSignupMetadata', () => {
  it('stores the store name under company_name', () => {
    expect(toSignupMetadata(valid)).toEqual({
      full_name: 'أحمد حافظ',
      company_name: 'متجر نور',
    })
  })
})

describe('sent state in the URL', () => {
  it('round-trips the email and never the password', () => {
    const search = buildSentSearch(' ahmed@noorstore.com ')
    expect(search).toBe('?sent=1&email=ahmed%40noorstore.com')
    expect(search).not.toContain('password')
    expect(readSentEmail(new URLSearchParams(search))).toBe(
      'ahmed@noorstore.com'
    )
  })

  it('ignores a missing flag or an invalid email', () => {
    expect(readSentEmail(new URLSearchParams('?email=a@b.co'))).toBeNull()
    expect(readSentEmail(new URLSearchParams('?sent=1&email=nope'))).toBeNull()
  })
})
