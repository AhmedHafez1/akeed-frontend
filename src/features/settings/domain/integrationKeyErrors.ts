import { ApiError } from '@/shared/lib/http'

/** Backend codes with their own copy under `apiKeys.errors`. */
const INTEGRATION_KEY_ERROR_CODES = [
  'API_KEY_ROLE_REQUIRED',
  'API_KEY_SOURCE_UNAVAILABLE',
  'API_KEY_SOURCE_AMBIGUOUS',
  'API_KEY_SOURCE_UNSUPPORTED',
  'API_KEY_SETUP_INCOMPLETE',
  'API_KEY_LIMIT_REACHED',
  'API_KEY_NOT_FOUND',
  'API_KEY_VALIDATION_FAILED',
] as const

export type IntegrationKeyErrorKey =
  | (typeof INTEGRATION_KEY_ERROR_CODES)[number]
  | 'RATE_LIMITED'
  | 'generic'

/** The `apiKeys.errors.*` key for a failed key request. */
export function integrationKeyErrorKey(error: unknown): IntegrationKeyErrorKey {
  if (!(error instanceof ApiError)) return 'generic'
  const known = INTEGRATION_KEY_ERROR_CODES.find((code) => code === error.code)
  if (known) return known
  if (error.status === 403) return 'API_KEY_ROLE_REQUIRED'
  if (error.status === 404) return 'API_KEY_NOT_FOUND'
  // The app-wide throttler answers 429 without a code.
  if (error.status === 429) return 'RATE_LIMITED'
  return 'generic'
}
