export type EasyOrdersConnectionState =
  | 'unavailable'
  | 'pilot_required'
  | 'source_exists'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'connected'
  /** Disconnected by an owner or admin; only the same store can reconnect. */
  | 'disconnected'

export interface EasyOrdersConnectionDetails {
  storeId: string
  /** False until an order fetched with the key carries the same store id. */
  storeVerified: boolean
  health: 'ok' | 'store_inactive' | 'credentials_rejected'
  /**
   * Last characters of the webhook addresses, to find them in EasyOrders.
   * Null once disconnected: the address is retired.
   */
  webhookUrlHint: string | null
  ordersSecretSet: boolean
  statusSecretSet: boolean
  /** Currency of every order from the store; null until chosen. */
  currency: string | null
  /** Country local phone numbers are read in; null until chosen. */
  phoneCountry: string | null
  /** Orders EasyOrders sent that were refused for a wrong webhook secret. */
  rejectedDeliveries: number
  connectedAt: string
  /** Set while disconnected, including while a reconnect is under way. */
  disconnectedAt: string | null
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
  /** Connected, but EasyOrders no longer accepts the stored key. */
  | 'revoked'
  | 'disconnected'

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
      return status.connection?.health === 'credentials_rejected'
        ? 'revoked'
        : 'success'
    case 'disconnected':
      return 'disconnected'
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
  'EASYORDERS_RECONNECT_STORE_MISMATCH',
  'EASYORDERS_NOT_CONNECTED',
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

/** True while a reconnect of a disconnected source is waiting or was refused. */
export function isEasyOrdersReconnect(
  status: EasyOrdersConnectionStatus | null
): boolean {
  return Boolean(status?.connection?.disconnectedAt)
}

/** EasyOrders secrets are printable, without spaces; 16 characters today. */
const WEBHOOK_SECRET_PATTERN = /^[\x21-\x7E]{8,128}$/

export function isValidWebhookSecret(value: string): boolean {
  return WEBHOOK_SECRET_PATTERN.test(value.trim())
}

/** The country, the currency and both webhook secrets are stored. */
export function hasEasyOrdersDetails(
  connection: Pick<
    EasyOrdersConnectionDetails,
    'currency' | 'phoneCountry' | 'ordersSecretSet' | 'statusSecretSet'
  >
): boolean {
  return Boolean(
    connection.currency &&
    connection.phoneCountry &&
    connection.ordersSecretSet &&
    connection.statusSecretSet
  )
}

export const EASYORDERS_CHECKLIST_ITEMS = [
  'store',
  'orderDefaults',
  'secrets',
  'sender',
] as const

export type EasyOrdersChecklistItemId =
  (typeof EASYORDERS_CHECKLIST_ITEMS)[number]

export interface EasyOrdersChecklistItem {
  id: EasyOrdersChecklistItemId
  done: boolean
}

/**
 * What must be in place before the test message, each on its own row. The
 * sender is Akeed's, so an unknown status does not hold the merchant back;
 * only a deployment that reports it is not configured does.
 */
export function buildEasyOrdersChecklist(
  connection: Pick<
    EasyOrdersConnectionDetails,
    'currency' | 'phoneCountry' | 'ordersSecretSet' | 'statusSecretSet'
  >,
  senderStatus: 'configured' | 'not_configured' | 'unknown'
): EasyOrdersChecklistItem[] {
  return [
    { id: 'store', done: true },
    {
      id: 'orderDefaults',
      done: Boolean(connection.currency && connection.phoneCountry),
    },
    {
      id: 'secrets',
      done: connection.ordersSecretSet && connection.statusSecretSet,
    },
    { id: 'sender', done: senderStatus !== 'not_configured' },
  ]
}
