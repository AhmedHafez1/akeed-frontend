import { describe, expect, it } from 'vitest'
import {
  getAuthErrorCode,
  getLoginRedirectPath,
  isAlreadyRegistered,
  parseAuthErrorParam,
  readAuthCallbackError,
} from './authErrors'

describe('getAuthErrorCode', () => {
  it('reads a string code and ignores anything else', () => {
    expect(getAuthErrorCode({ code: 'weak_password' })).toBe('weak_password')
    expect(getAuthErrorCode({ code: 422 })).toBeNull()
    expect(getAuthErrorCode(new Error('x'))).toBeNull()
    expect(getAuthErrorCode(null)).toBeNull()
  })
})

describe('isAlreadyRegistered', () => {
  it('recognises the explicit error codes', () => {
    expect(isAlreadyRegistered({ code: 'user_already_exists' })).toBe(true)
    expect(isAlreadyRegistered({ code: 'email_exists' })).toBe(true)
    expect(isAlreadyRegistered({ code: 'weak_password' })).toBe(false)
  })

  it('recognises the obfuscated user Supabase returns with Confirm email on', () => {
    expect(isAlreadyRegistered(null, { user: { identities: [] } })).toBe(true)
    expect(
      isAlreadyRegistered(null, { user: { identities: [{ id: '1' }] } })
    ).toBe(false)
    expect(isAlreadyRegistered(null, { user: null })).toBe(false)
  })
})

describe('readAuthCallbackError', () => {
  it('reads an expired link from the hash (implicit flow)', () => {
    expect(
      readAuthCallbackError({
        hash: '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
        search: '',
      })
    ).toBe('link_expired')
  })

  it('reads an error from the query (PKCE flow)', () => {
    expect(
      readAuthCallbackError({ hash: '', search: '?error_code=otp_expired' })
    ).toBe('link_expired')
    expect(
      readAuthCallbackError({ hash: '', search: '?error=server_error' })
    ).toBe('unknown')
  })

  it('returns null when the URL carries no error', () => {
    expect(readAuthCallbackError({ hash: '', search: '?step=store' })).toBe(
      null
    )
    expect(
      readAuthCallbackError({ hash: '#access_token=abc', search: '' })
    ).toBe(null)
  })
})

describe('getLoginRedirectPath', () => {
  it('forwards a rejected link to login as auth_error', () => {
    expect(
      getLoginRedirectPath('ar', {
        hash: '#error=access_denied&error_code=otp_expired',
        search: '',
      })
    ).toBe('/ar/login?auth_error=link_expired')
  })

  it('is plain login otherwise', () => {
    expect(getLoginRedirectPath('en', { hash: '', search: '' })).toBe(
      '/en/login'
    )
  })
})

describe('parseAuthErrorParam', () => {
  it('accepts only known values', () => {
    expect(parseAuthErrorParam('link_expired')).toBe('link_expired')
    expect(parseAuthErrorParam('unknown')).toBe('unknown')
    expect(parseAuthErrorParam('<script>')).toBeNull()
    expect(parseAuthErrorParam(null)).toBeNull()
  })
})
