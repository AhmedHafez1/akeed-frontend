/**
 * What Meta's sign-in sent back to the connect page.
 *
 * The page sends its own tab to Meta, and Meta sends it back with
 * `?code=&state=` after a finished signup, or `?error=&state=` after a cancel
 * or a failure. `state` is the page's signup ticket, returned unchanged.
 * Both are read once and removed from the address before anything else
 * happens, so they stay out of history, shared links and later requests.
 */

const TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/
const CODE_PATTERN = /^[\x21-\x7e]{1,2048}$/
const META_ERROR_CODE = /^\d{1,12}$/

/** Every parameter Meta may add on the way back. */
const RETURN_PARAMS = [
  'code',
  'state',
  'error',
  'error_code',
  'error_description',
  'error_reason',
] as const

export type SignupReturn =
  | { kind: 'code'; signupTicket: string; code: string }
  | {
      kind: 'error'
      signupTicket: string
      /** The merchant left Meta's flow, as opposed to Meta failing. */
      cancelled: boolean
      /** Meta's numeric error code, for guidance. */
      metaErrorCode: string | null
    }
  /** Return parameters that do not add up: treated as a broken link. */
  | { kind: 'invalid' }

/** The return in `params`, or null when the page was not opened by Meta. */
export function readSignupReturn(params: URLSearchParams): SignupReturn | null {
  if (!params.has('state') && !params.has('code') && !params.has('error'))
    return null
  const state = params.get('state') ?? ''
  if (!TICKET_PATTERN.test(state)) return { kind: 'invalid' }

  const code = params.get('code')
  if (code !== null)
    return CODE_PATTERN.test(code)
      ? { kind: 'code', signupTicket: state, code }
      : { kind: 'invalid' }

  if (params.get('error') === null) return { kind: 'invalid' }
  const errorCode = params.get('error_code')
  return {
    kind: 'error',
    signupTicket: state,
    cancelled:
      params.get('error') === 'access_denied' ||
      params.get('error_reason') === 'user_denied',
    metaErrorCode:
      errorCode && META_ERROR_CODE.test(errorCode) && errorCode !== '200'
        ? errorCode
        : null,
  }
}

/**
 * Removes the return parameters and Meta's `#_=_` from `url`. Returns the
 * cleaned path, query and hash, or null when there was nothing to remove.
 */
export function withoutSignupReturn(url: URL): string | null {
  const clean = new URL(url.href)
  for (const name of RETURN_PARAMS) clean.searchParams.delete(name)
  if (clean.hash === '#_=_') clean.hash = ''
  if (clean.href === url.href) return null
  return `${clean.pathname}${clean.search}${clean.hash}`
}
