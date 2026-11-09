import { withLocale } from '@/shared/lib/locale'

/**
 * Pure helpers for reading Supabase auth errors. Kept apart from `auth.ts` so
 * they can be tested without a Supabase client.
 */

export function getAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null
  }

  const code = error.code
  return typeof code === 'string' ? code : null
}

const ALREADY_REGISTERED_CODES = new Set([
  'user_already_exists',
  'email_exists',
])

interface SignUpResultLike {
  user?: { identities?: readonly unknown[] | null } | null
}

/**
 * True when the email already belongs to an account. With "Confirm email" on,
 * Supabase does not return an error for this: it answers with an obfuscated
 * user that has no identities, so both shapes are checked.
 */
export function isAlreadyRegistered(
  error: unknown,
  data?: SignUpResultLike | null
): boolean {
  const code = getAuthErrorCode(error)
  if (code && ALREADY_REGISTERED_CODES.has(code)) return true

  const identities = data?.user?.identities
  return Array.isArray(identities) && identities.length === 0
}

export type AuthCallbackError = 'link_expired' | 'unknown'

const LINK_EXPIRED_CODES = new Set(['otp_expired', 'access_denied'])

/**
 * Reads the error Supabase appends when an email link is expired, already
 * used or otherwise rejected: in the hash for the implicit flow, in the query
 * for PKCE. Returns null when the URL carries no auth error.
 */
export function readAuthCallbackError(location: {
  hash: string
  search: string
}): AuthCallbackError | null {
  const sources = [
    new URLSearchParams(location.hash.replace(/^#/, '')),
    new URLSearchParams(location.search),
  ]

  for (const params of sources) {
    const code = params.get('error_code')
    const error = params.get('error')
    if (!code && !error) continue
    if (
      (code && LINK_EXPIRED_CODES.has(code)) ||
      (error && LINK_EXPIRED_CODES.has(error))
    ) {
      return 'link_expired'
    }
    return 'unknown'
  }

  return null
}

export const AUTH_ERROR_PARAM = 'auth_error'

/**
 * Login, carrying the reason when this visit came from a rejected email link.
 * Supabase leaves the error in the URL, which a plain redirect would drop.
 */
export function getLoginRedirectPath(
  locale: string,
  location: { hash: string; search: string; pathname?: string }
): string {
  const loginPath = withLocale('/login', locale)
  const callbackError = readAuthCallbackError(location)
  const params = new URLSearchParams()
  if (callbackError) params.set(AUTH_ERROR_PARAM, callbackError)
  const returnTo = safeOrderReturnPath(
    `${location.pathname ?? ''}${location.search}`
  )
  if (returnTo) params.set('returnTo', returnTo)
  return params.size ? `${loginPath}?${params.toString()}` : loginPath
}

/** Only the authenticated order deep link may survive sign-in; never an external redirect. */
export function safeOrderReturnPath(
  value: string | null | undefined
): string | null {
  if (!value || !/^\/(ar|en|ur|es|fr|tr)\/verifications\?/.test(value))
    return null
  try {
    const url = new URL(value, 'https://akeed.invalid')
    if (
      url.origin !== 'https://akeed.invalid' ||
      url.hash ||
      !/^\/(ar|en|ur|es|fr|tr)\/verifications$/.test(url.pathname)
    )
      return null
    const open = url.searchParams.get('open')
    if (
      !open ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        open
      )
    )
      return null
    return `${url.pathname}?${new URLSearchParams({ open })}`
  } catch {
    return null
  }
}

export function parseAuthErrorParam(
  value: string | null | undefined
): AuthCallbackError | null {
  return value === 'link_expired' || value === 'unknown' ? value : null
}
