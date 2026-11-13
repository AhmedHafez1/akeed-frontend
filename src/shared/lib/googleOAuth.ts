'use client'

import type { User } from '@supabase/supabase-js'
import { createGoogleOAuthClient, getSupabaseClient } from '@/shared/lib/auth'
import { safeOrderReturnPath } from '@/shared/lib/authErrors'
import { parseSignupSourceParam } from '@/shared/config/commerceSources'
import {
  isSupportedLocale,
  withLocale,
  type SupportedLocale,
} from '@/shared/lib/locale'

const ATTEMPT_KEY = 'akeed:google:attempt'
const AUTH_TTL = 10 * 60 * 1000
const COMPLETION_TTL = 24 * 60 * 60 * 1000

export interface GoogleAttempt {
  id: string
  startedAt: number
  locale: SupportedLocale
  intent: 'login' | 'signup'
  source: string | null
  returnTo: string | null
  userId: string | null
  phase: 'pending' | 'authenticated' | 'provisioning'
}

export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
}

export function googleAccountPath(locale: string): string {
  return withLocale('/signup/google', locale)
}

function storageKey(attempt: GoogleAttempt): string {
  return `akeed:google:${attempt.id}`
}

/** Persist the verifier across navigation, but never the temporary client's session. */
export function googleVerifierStorage(key: string, storage: Storage) {
  const verifierKey = `${key}-code-verifier`
  return {
    getItem: (name: string) =>
      name === verifierKey ? storage.getItem(name) : null,
    setItem: (name: string, value: string) => {
      if (name === verifierKey) storage.setItem(name, value)
    },
    removeItem: (name: string) => {
      if (name === verifierKey) storage.removeItem(name)
    },
  }
}

export function readGoogleAttempt(now = Date.now()): GoogleAttempt | null {
  try {
    const raw: unknown = JSON.parse(
      sessionStorage.getItem(ATTEMPT_KEY) ?? 'null'
    )
    if (!raw || typeof raw !== 'object') return null
    const a = raw as Partial<GoogleAttempt>
    if (
      typeof a.id !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(a.id) ||
      typeof a.startedAt !== 'number' ||
      !Number.isFinite(a.startedAt) ||
      a.startedAt > now ||
      !isSupportedLocale(a.locale ?? '') ||
      !['login', 'signup'].includes(a.intent ?? '') ||
      !['pending', 'authenticated', 'provisioning'].includes(a.phase ?? '') ||
      (a.userId !== null && typeof a.userId !== 'string') ||
      (a.phase !== 'pending' && !a.userId) ||
      now - a.startedAt > (a.phase === 'pending' ? AUTH_TTL : COMPLETION_TTL)
    )
      return null
    return {
      ...(a as GoogleAttempt),
      source: parseSignupSourceParam(a.source),
      returnTo: safeOrderReturnPath(a.returnTo),
    }
  } catch {
    return null
  }
}

export function saveGoogleAttempt(attempt: GoogleAttempt): void {
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt))
}

export function clearGoogleAttempt(): void {
  try {
    const raw = JSON.parse(
      sessionStorage.getItem(ATTEMPT_KEY) ?? 'null'
    ) as Partial<GoogleAttempt> | null
    if (typeof raw?.id === 'string' && /^[a-f0-9-]{36}$/.test(raw.id))
      sessionStorage.removeItem(`akeed:google:${raw.id}-code-verifier`)
  } catch {
    /* Malformed attempt data contains no usable verifier reference. */
  }
  sessionStorage.removeItem(ATTEMPT_KEY)
  callbackPromise = null
}

export async function startGoogleSignIn(options: {
  locale: SupportedLocale
  intent: 'login' | 'signup'
  source?: string | null
  returnTo?: string | null
}): Promise<string> {
  if (!isGoogleAuthEnabled()) throw new Error('GOOGLE_AUTH_UNAVAILABLE')
  clearGoogleAttempt()
  const attempt: GoogleAttempt = {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    locale: options.locale,
    intent: options.intent,
    source: parseSignupSourceParam(options.source),
    returnTo: safeOrderReturnPath(options.returnTo),
    userId: null,
    phase: 'pending',
  }
  // Fail before leaving the page if storage is blocked.
  saveGoogleAttempt(attempt)
  const key = storageKey(attempt)
  const client = createGoogleOAuthClient(
    key,
    googleVerifierStorage(key, sessionStorage)
  )
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: new URL(
          googleAccountPath(attempt.locale),
          window.location.origin
        ).toString(),
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error || !data.url) throw new Error('GOOGLE_AUTH_START_FAILED')
    return data.url
  } catch {
    clearGoogleAttempt()
    throw new Error('GOOGLE_AUTH_START_FAILED')
  } finally {
    await client.auth.stopAutoRefresh()
  }
}

let callbackPromise: Promise<{ user: User; attempt: GoogleAttempt }> | null =
  null

/** One exchange per document, including React's effect replay. Never fall back to an old session. */
export function finishGoogleSignIn(): Promise<{
  user: User
  attempt: GoogleAttempt
}> {
  if (callbackPromise) return callbackPromise
  const attemptId = readGoogleAttempt()?.id
  callbackPromise = exchangeGoogleCallback().catch((error) => {
    try {
      if (readGoogleAttempt()?.id === attemptId) clearGoogleAttempt()
    } catch {
      console.warn('[Auth] Google attempt cleanup failed')
    }
    throw error
  })
  return callbackPromise
}

async function exchangeGoogleCallback(): Promise<{
  user: User
  attempt: GoogleAttempt
}> {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const code = url.searchParams.get('code')
  const rejected =
    url.searchParams.has('error') ||
    hash.has('error') ||
    hash.has('access_token')
  // No provider diagnostics or credentials survive in the address or referrer.
  window.history.replaceState(window.history.state, '', url.pathname)
  const attempt = readGoogleAttempt()
  if (
    !isGoogleAuthEnabled() ||
    !attempt ||
    rejected ||
    url.pathname.replace(/\/$/, '') !== googleAccountPath(attempt.locale)
  )
    throw new Error('GOOGLE_AUTH_CALLBACK_FAILED')
  const main = getSupabaseClient()
  if (attempt.phase === 'pending') {
    if (!code) throw new Error('GOOGLE_AUTH_CALLBACK_MISSING')
    const key = storageKey(attempt)
    const client = createGoogleOAuthClient(
      key,
      googleVerifierStorage(key, sessionStorage)
    )
    try {
      const { data, error } = await client.auth.exchangeCodeForSession(code)
      if (error || !data.session || !data.user)
        throw new Error('GOOGLE_AUTH_EXCHANGE_FAILED')
      if (readGoogleAttempt()?.id !== attempt.id)
        throw new Error('GOOGLE_AUTH_ATTEMPT_CHANGED')
      const { error: sessionError } = await main.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      if (sessionError) throw new Error('GOOGLE_AUTH_SESSION_FAILED')
      if (readGoogleAttempt()?.id !== attempt.id)
        throw new Error('GOOGLE_AUTH_ATTEMPT_CHANGED')
      attempt.userId = data.user.id
      attempt.phase = 'authenticated'
      saveGoogleAttempt(attempt)
    } finally {
      sessionStorage.removeItem(`${key}-code-verifier`)
      await client.auth.stopAutoRefresh()
    }
  } else if (code) {
    throw new Error('GOOGLE_AUTH_CALLBACK_REPLAY')
  }
  const { data, error } = await main.auth.getUser()
  if (error || !data.user || data.user.id !== attempt.userId)
    throw new Error('GOOGLE_AUTH_SESSION_FAILED')
  return { user: data.user, attempt }
}
