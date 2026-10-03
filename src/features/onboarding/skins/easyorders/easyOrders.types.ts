export type EasyOrdersConnectionState =
  | 'unavailable'
  | 'pilot_required'
  | 'source_exists'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'connected'

export interface EasyOrdersConnectionDetails {
  storeId: string
  /** False until an order fetched with the key carries the same store id. */
  storeVerified: boolean
  health: 'ok' | 'store_inactive' | 'credentials_rejected'
  /** Last characters of the webhook addresses, to find them in EasyOrders. */
  webhookUrlHint: string
  ordersSecretSet: boolean
  statusSecretSet: boolean
  /** Currency of every order from the store; null until chosen. */
  currency: string | null
  /** Country local phone numbers are read in; null until chosen. */
  phoneCountry: string | null
  /** Orders EasyOrders sent that were refused for a wrong webhook secret. */
  rejectedDeliveries: number
  connectedAt: string
}

/** Never carries a key, a token or a webhook secret. */
export interface EasyOrdersConnectionStatus {
  state: EasyOrdersConnectionState
  canManage: boolean
  organizationName: string | null
  expiresAt: string | null
  lastErrorCode: string | null
  connection: EasyOrdersConnectionDetails | null
}

export interface EasyOrdersInstallStarted {
  installUrl: string
  expiresAt: string
}

export interface EasyOrdersWebhookSecrets {
  ordersSecret: string
  statusSecret: string
}

export interface EasyOrdersOrderSettings {
  currency: string
  phoneCountry: string
}

/** What the connect screen shows; one of these at a time. */
export type EasyOrdersConnectView =
  | 'loading'
  | 'loadError'
  | 'unavailable'
  | 'pilotRequired'
  | 'sourceExists'
  | 'connect'
  | 'waiting'
  | 'denied'
  | 'error'
  | 'success'

/**
 * `cancelled` is the merchant saying they did not accept. EasyOrders sends no
 * signal for a declined or abandoned request, so that and an expired request
 * are the only ways the screen learns of one.
 */
export function resolveEasyOrdersConnectView(
  status: EasyOrdersConnectionStatus | null,
  options: { isLoading: boolean; loadFailed: boolean; cancelled: boolean }
): EasyOrdersConnectView {
  if (!status) {
    if (options.loadFailed) return 'loadError'
    return options.isLoading ? 'loading' : 'loadError'
  }
  switch (status.state) {
    case 'connected':
      return 'success'
    case 'unavailable':
      return 'unavailable'
    case 'pilot_required':
      return 'pilotRequired'
    case 'source_exists':
      return 'sourceExists'
    case 'failed':
      return 'error'
    case 'expired':
      return 'denied'
    case 'pending':
      return options.cancelled ? 'denied' : 'waiting'
    default:
      return options.cancelled ? 'denied' : 'connect'
  }
}

/** Codes with their own message under `easyOrdersConnect.error.codes`. */
export const EASYORDERS_ERROR_CODES = [
  'EASYORDERS_KEY_REJECTED',
  'EASYORDERS_PROVIDER_UNAVAILABLE',
  'EASYORDERS_STORE_UNAVAILABLE',
  'EASYORDERS_SOURCE_EXISTS',
  'EASYORDERS_CALLBACK_INVALID',
  'EASYORDERS_PILOT_REQUIRED',
  'EASYORDERS_CONNECT_UNAVAILABLE',
  'EASYORDERS_ROLE_REQUIRED',
] as const

export type EasyOrdersErrorCode = (typeof EASYORDERS_ERROR_CODES)[number]

export function toEasyOrdersErrorKey(
  code: string | null | undefined
): EasyOrdersErrorCode | 'default' {
  return EASYORDERS_ERROR_CODES.find((known) => known === code) ?? 'default'
}

/** EasyOrders secrets are printable, without spaces; 16 characters today. */
const WEBHOOK_SECRET_PATTERN = /^[\x21-\x7E]{8,128}$/

export function isValidWebhookSecret(value: string): boolean {
  return WEBHOOK_SECRET_PATTERN.test(value.trim())
}
