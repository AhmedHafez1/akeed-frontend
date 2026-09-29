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
  location: { hash: string; search: string }
): string {
  const loginPath = withLocale('/login', locale)
  const callbackError = readAuthCallbackError(location)
  if (!callbackError) return loginPath
  const params = new URLSearchParams({ [AUTH_ERROR_PARAM]: callbackError })
  return `${loginPath}?${params.toString()}`
}

export function parseAuthErrorParam(
  value: string | null | undefined
): AuthCallbackError | null {
  return value === 'link_expired' || value === 'unknown' ? value : null
}
