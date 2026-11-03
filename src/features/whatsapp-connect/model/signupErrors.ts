/**
 * Message keys for what can go wrong, under `whatsappConnect.errors` and
 * `whatsappConnect.metaErrors`. Unknown codes fall back to a general message,
 * so a new code never shows raw text.
 */

export const NETWORK_ERROR_CODE = 'NETWORK'

const SERVER_ERROR_KEYS = {
  WHATSAPP_CONNECT_TICKET_INVALID: 'ticketInvalid',
  WHATSAPP_CONNECT_UNAVAILABLE: 'unavailable',
  WHATSAPP_CONNECTION_OWNER_REQUIRED: 'ownerRequired',
  WHATSAPP_CONNECTION_EXISTS: 'connectionExists',
  WHATSAPP_NUMBER_ALREADY_CONNECTED: 'numberAlreadyConnected',
  WHATSAPP_SIGNUP_CODE_REJECTED: 'codeRejected',
  WHATSAPP_SIGNUP_PROVIDER_UNAVAILABLE: 'providerUnavailable',
  WHATSAPP_SIGNUP_TOKEN_UNVERIFIED: 'tokenUnverified',
  WHATSAPP_SIGNUP_ASSET_UNVERIFIED: 'assetUnverified',
  WHATSAPP_SIGNUP_ASSET_AMBIGUOUS: 'assetAmbiguous',
  [NETWORK_ERROR_CODE]: 'network',
} as const

export type ServerErrorKey =
  | (typeof SERVER_ERROR_KEYS)[keyof typeof SERVER_ERROR_KEYS]
  | 'default'

export function serverErrorKey(
  code: string | null | undefined
): ServerErrorKey {
  if (code && Object.hasOwn(SERVER_ERROR_KEYS, code))
    return SERVER_ERROR_KEYS[code as keyof typeof SERVER_ERROR_KEYS]
  return 'default'
}

/** Meta's Embedded Signup error codes, as its error reference explains them. */
const META_ERROR_KEYS: Record<string, MetaErrorKey> = {
  '2655093': 'sharedWithPartner',
  '2655049': 'sharedWithPartner',
  '2494028': 'sharedWithPartner',
  '3441045': 'notEligible',
  '4563015': 'updateApp',
  '3441049': 'registeredElsewhere',
  '2655094': 'registeredElsewhere',
  '3441042': 'regionUnavailable',
  '3441033': 'tooManyAttempts',
  '3441046': 'tooManyAttempts',
  '1390006': 'tooManyAttempts',
  '1675004': 'tooManyAttempts',
  '1390008': 'tooManyAttempts',
  '2494158': 'tooManyAttempts',
  '2388367': 'tooManyAttempts',
  '2859009': 'twoFactorRequired',
  '4612001': 'twoFactorRequired',
}

export type MetaErrorKey =
  | 'sharedWithPartner'
  | 'notEligible'
  | 'updateApp'
  | 'registeredElsewhere'
  | 'regionUnavailable'
  | 'tooManyAttempts'
  | 'twoFactorRequired'
  | 'default'

export function metaErrorKey(code: string | null | undefined): MetaErrorKey {
  return (code && META_ERROR_KEYS[code]) || 'default'
}
