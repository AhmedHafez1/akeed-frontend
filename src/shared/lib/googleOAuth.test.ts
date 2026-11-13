import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { createGoogleOAuthClient, getSupabaseClient } from './auth'
import {
  clearGoogleAttempt,
  finishGoogleSignIn,
  googleVerifierStorage,
  readGoogleAttempt,
  saveGoogleAttempt,
  startGoogleSignIn,
  type GoogleAttempt,
} from './googleOAuth'

vi.mock('./auth', () => ({
  createGoogleOAuthClient: vi.fn(),
  getSupabaseClient: vi.fn(),
}))

const user = {
  id: 'user-google',
  email: 'synthetic@example.com',
  created_at: new Date().toISOString(),
  user_metadata: {},
} as User
const attempt = (overrides: Partial<GoogleAttempt> = {}): GoogleAttempt => ({
  id: 'f2544092-3e69-4baf-8738-18705dde3191',
  startedAt: Date.now(),
  locale: 'en',
  intent: 'signup',
  source: 'standalone',
  returnTo: null,
  userId: null,
  phase: 'pending',
  ...overrides,
})
const exchange = vi.fn()
const setSession = vi.fn()
const getUser = vi.fn()
const start = vi.fn()
const stop = vi.fn()

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_AUTH_ENABLED', 'true')
  sessionStorage.clear()
  clearGoogleAttempt()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/en/signup/google')
  exchange.mockResolvedValue({
    data: {
      user,
      session: {
        access_token: 'synthetic-access',
        refresh_token: 'synthetic-refresh',
        provider_token: 'never-persist',
      },
    },
    error: null,
  })
  start.mockResolvedValue({
    data: { url: 'https://synthetic.supabase.co/auth/v1/authorize' },
    error: null,
  })
  setSession.mockResolvedValue({ error: null })
  getUser.mockResolvedValue({ data: { user }, error: null })
  vi.mocked(createGoogleOAuthClient).mockReturnValue({
    auth: {
      exchangeCodeForSession: exchange,
      signInWithOAuth: start,
      stopAutoRefresh: stop,
    },
  } as unknown as ReturnType<typeof createGoogleOAuthClient>)
  vi.mocked(getSupabaseClient).mockReturnValue({
    auth: { setSession, getUser },
  } as unknown as ReturnType<typeof getSupabaseClient>)
})
afterEach(() => vi.unstubAllEnvs())

describe('Google OAuth attempt and verifier isolation', () => {
  it('leaves the current page available when browser storage is blocked', async () => {
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new Error('storage blocked')
      })
    await expect(
      startGoogleSignIn({
        locale: 'en',
        intent: 'signup',
        source: 'standalone',
      })
    ).rejects.toThrow()
    expect(start).not.toHaveBeenCalled()
    write.mockRestore()
  })
  it('starts Google with a fixed localized callback and allowlisted context', async () => {
    expect(
      await startGoogleSignIn({
        locale: 'ar',
        intent: 'signup',
        source: 'shopify',
        returnTo: 'https://evil.invalid',
      })
    ).toContain('/auth/v1/authorize')
    expect(start).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: new URL(
          '/ar/signup/google',
          window.location.origin
        ).toString(),
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    })
    expect(readGoogleAttempt()).toMatchObject({
      locale: 'ar',
      source: null,
      returnTo: null,
      phase: 'pending',
    })
  })
  it('refuses a disabled provider before creating an attempt', async () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_AUTH_ENABLED', 'false')
    await expect(
      startGoogleSignIn({ locale: 'en', intent: 'login' })
    ).rejects.toThrow('UNAVAILABLE')
    expect(start).not.toHaveBeenCalled()
    expect(readGoogleAttempt()).toBeNull()
  })
  it('removes the attempt and verifier when starting fails', async () => {
    start.mockResolvedValue({
      data: { url: null },
      error: { message: 'private provider diagnostic' },
    })
    await expect(
      startGoogleSignIn({ locale: 'en', intent: 'login' })
    ).rejects.toThrow('START_FAILED')
    expect(readGoogleAttempt()).toBeNull()
  })
  it('rejects expired, future and malformed attempts and disabled sources', () => {
    saveGoogleAttempt(attempt({ startedAt: Date.now() - 600_001 }))
    expect(readGoogleAttempt()).toBeNull()
    saveGoogleAttempt(attempt({ startedAt: Date.now() + 10000 }))
    expect(readGoogleAttempt()).toBeNull()
    sessionStorage.setItem('akeed:google:attempt', '{broken')
    expect(readGoogleAttempt()).toBeNull()
    saveGoogleAttempt(attempt({ source: 'woocommerce' }))
    expect(readGoogleAttempt()?.source).toBeNull()
  })
  it('persists only the PKCE verifier, never session or provider tokens', () => {
    const storage = googleVerifierStorage('test-google', sessionStorage)
    storage.setItem('test-google-code-verifier', 'synthetic-verifier')
    storage.setItem('test-google', 'private-session')
    expect(storage.getItem('test-google-code-verifier')).toBe(
      'synthetic-verifier'
    )
    expect(sessionStorage.getItem('test-google')).toBeNull()
    expect(storage.getItem('test-google')).toBeNull()
    storage.removeItem('test-google-code-verifier')
    expect(sessionStorage.length).toBe(0)
  })
  it('cleans an expired attempt verifier on abandonment', () => {
    const a = attempt({ startedAt: Date.now() - 600_001 })
    saveGoogleAttempt(a)
    sessionStorage.setItem(
      `akeed:google:${a.id}-code-verifier`,
      'expired-verifier'
    )
    clearGoogleAttempt()
    expect(sessionStorage.length).toBe(0)
  })
})

describe('Google callback', () => {
  it('does not replace a newer attempt with a delayed old exchange', async () => {
    saveGoogleAttempt(attempt())
    window.history.replaceState(
      null,
      '',
      '/en/signup/google?code=synthetic-code'
    )
    exchange.mockImplementationOnce(async () => {
      saveGoogleAttempt(attempt({ id: '04ef96f2-8ea5-4f87-913f-0f97acde3cb1' }))
      return {
        data: {
          user,
          session: { access_token: 'old-access', refresh_token: 'old-refresh' },
        },
        error: null,
      }
    })
    await expect(finishGoogleSignIn()).rejects.toThrow('ATTEMPT_CHANGED')
    expect(setSession).not.toHaveBeenCalled()
    expect(readGoogleAttempt()?.id).toBe('04ef96f2-8ea5-4f87-913f-0f97acde3cb1')
  })
  it('refuses an expired completion session and clears its checkpoint', async () => {
    saveGoogleAttempt(attempt({ phase: 'authenticated', userId: user.id }))
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'expired synthetic session' },
    })
    await expect(finishGoogleSignIn()).rejects.toThrow('SESSION_FAILED')
    expect(readGoogleAttempt()).toBeNull()
  })
  it('exchanges once under effect replay and transfers only Supabase session tokens', async () => {
    const a = attempt()
    saveGoogleAttempt(a)
    sessionStorage.setItem(
      `akeed:google:${a.id}-code-verifier`,
      'synthetic-verifier'
    )
    window.history.replaceState(null, '', '/en/signup/google?code=private-code')
    const first = finishGoogleSignIn(),
      replay = finishGoogleSignIn()
    expect(replay).toBe(first)
    await expect(first).resolves.toMatchObject({
      user,
      attempt: { phase: 'authenticated', userId: user.id },
    })
    expect(exchange).toHaveBeenCalledTimes(1)
    expect(setSession).toHaveBeenCalledWith({
      access_token: 'synthetic-access',
      refresh_token: 'synthetic-refresh',
    })
    expect(window.location.search).toBe('')
    expect(
      sessionStorage.getItem(`akeed:google:${a.id}-code-verifier`)
    ).toBeNull()
    expect(sessionStorage.getItem('akeed:google:attempt')).not.toContain(
      'synthetic-access'
    )
  })
  it.each([
    '?error=access_denied&error_description=private',
    '?code=private#access_token=private',
    '',
  ])(
    'rejects cancellation or missing callback without accepting an old session: %s',
    async (suffix) => {
      saveGoogleAttempt(attempt())
      window.history.replaceState(null, '', '/en/signup/google' + suffix)
      await expect(finishGoogleSignIn()).rejects.toThrow()
      expect(exchange).not.toHaveBeenCalled()
      expect(getUser).not.toHaveBeenCalled()
      expect(window.location.search + window.location.hash).toBe('')
    }
  )
  it('rejects missing context and a callback in the wrong locale', async () => {
    window.history.replaceState(null, '', '/en/signup/google?code=private')
    await expect(finishGoogleSignIn()).rejects.toThrow()
    clearGoogleAttempt()
    saveGoogleAttempt(attempt({ locale: 'ar' }))
    window.history.replaceState(null, '', '/en/signup/google?code=private')
    await expect(finishGoogleSignIn()).rejects.toThrow()
    expect(exchange).not.toHaveBeenCalled()
  })
  it('resumes completion after refresh only for the checkpoint identity', async () => {
    saveGoogleAttempt(attempt({ phase: 'authenticated', userId: user.id }))
    await expect(finishGoogleSignIn()).resolves.toMatchObject({ user })
    expect(exchange).not.toHaveBeenCalled()
    clearGoogleAttempt()
    saveGoogleAttempt(attempt({ phase: 'authenticated', userId: 'other-user' }))
    await expect(finishGoogleSignIn()).rejects.toThrow('SESSION_FAILED')
  })
  it('rejects a reused callback and a failed exchange without leaking provider diagnostics', async () => {
    saveGoogleAttempt(attempt({ phase: 'authenticated', userId: user.id }))
    window.history.replaceState(null, '', '/en/signup/google?code=reused')
    await expect(finishGoogleSignIn()).rejects.toThrow('REPLAY')
    clearGoogleAttempt()
    saveGoogleAttempt(attempt())
    window.history.replaceState(null, '', '/en/signup/google?code=private')
    exchange.mockResolvedValue({
      data: { session: null },
      error: { message: 'provider secret' },
    })
    await expect(finishGoogleSignIn()).rejects.toThrow('EXCHANGE_FAILED')
    expect(setSession).not.toHaveBeenCalled()
  })
})
