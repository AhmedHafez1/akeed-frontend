export type WooCommerceConnectionState =
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

export type WooCommerceWebhookKind = 'order_created' | 'order_updated'

/**
 * What the store last answered for a webhook. `missing`: the store no longer
 * has it. `unknown`: the store could not be asked.
 */
export type WooCommerceWebhookState =
  | 'active'
  | 'paused'
  | 'disabled'
  | 'missing'
  | 'unknown'

export interface WooCommerceWebhook {
  kind: WooCommerceWebhookKind
  state: WooCommerceWebhookState
}

export interface WooCommerceConnectionDetails {
  storeUrl: string
  health: 'ok' | 'credentials_rejected' | 'permission_denied'
  connectedAt: string
  /** Deliveries the store sent that failed the signature or source check. */
  rejectedDeliveries: number
  /** The last states read from the store; empty once disconnected. */
  webhooks: WooCommerceWebhook[]
  /** When the store was last asked. Nothing asks it in the background. */
  webhooksCheckedAt: string | null
  /** Set while disconnected, including while a reconnect is under way. */
  disconnectedAt: string | null
}

/** Never carries a key, a secret, a token or the authorize link. */
export interface WooCommerceConnectionStatus {
  state: WooCommerceConnectionState
  canManage: boolean
  organizationName: string | null
  /** The canonical address of the store connected, or being connected. */
  storeUrl: string | null
  expiresAt: string | null
  lastErrorCode: string | null
  connection: WooCommerceConnectionDetails | null
}

/**
 * Whether Akeed's webhooks were deleted in the store at disconnect. `failed`:
 * they are still there until the merchant deletes them.
 */
export type WooCommerceWebhookCleanup = 'removed' | 'failed' | 'not_attempted'

export interface WooCommerceDisconnected extends WooCommerceConnectionStatus {
  webhookCleanup: WooCommerceWebhookCleanup
}

/** What a connection check found. Empty `problems` means nothing is wrong. */
export interface WooCommerceConnectionCheck {
  checkedAt: string
  problems: string[]
  webhooks: WooCommerceWebhook[]
  status: WooCommerceConnectionStatus
}

export interface WooCommerceInstallStarted {
  /** A credential: navigated to, never shown, logged or stored. */
  authorizeUrl: string
  storeUrl: string
  expiresAt: string
}

/**
 * What the store's redirect back said (`success` on `return_url`). A hint
 * for the screen only: it proves nothing and changes nothing.
 */
export type WooCommerceReturnHint = 'approved' | 'denied' | null

export function parseWooCommerceReturnHint(
  search: string
): WooCommerceReturnHint {
  const success = new URLSearchParams(search).get('success')
  if (success === '1') return 'approved'
  if (success === '0') return 'denied'
  return null
}

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i

/**
 * What the merchant typed, as an address the API can check. A bare domain is
 * taken to mean https; anything with a scheme is sent as typed, so the API
 * still answers plain HTTP with its own message.
 */
export function toStoreAddress(typed: string): string {
  const value = typed.trim()
  return SCHEME.test(value) ? value : `https://${value}`
}

/**
 * The store as the connection line names it: host and path, no scheme. Null
 * while what was typed is not yet an address.
 */
export function displayStoreAddress(
  address: string | null | undefined
): string | null {
  if (!address?.trim()) return null
  try {
    const url = new URL(toStoreAddress(address))
    if (!url.hostname.includes('.')) return null
    return `${url.hostname}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

/** What the connect screen shows; one of these at a time. */
export type WooCommerceConnectView =
  | 'loading'
  | 'loadError'
  | 'unavailable'
  | 'pilotRequired'
  | 'sourceExists'
  | 'enterUrl'
  | 'waiting'
  | 'denied'
  | 'unsupported'
  | 'error'
  | 'connected'
  /** Connected, but the store no longer accepts or allows Akeed's key. */
  | 'credentialsRejected'
  | 'disconnected'

/**
 * The store cannot be connected as it is (the contract record's support
 * boundary). Each has its own message telling the merchant what to change.
 */
export const WOOCOMMERCE_UNSUPPORTED_STORE_CODES = [
  'WOOCOMMERCE_STORE_URL_INVALID',
  'WOOCOMMERCE_STORE_HTTPS_REQUIRED',
  'WOOCOMMERCE_STORE_ADDRESS_NOT_PUBLIC',
  'WOOCOMMERCE_STORE_REDIRECTS',
  'WOOCOMMERCE_STORE_TLS_FAILED',
  'WOOCOMMERCE_REST_NOT_FOUND',
  'WOOCOMMERCE_REST_UNREACHABLE',
  'WOOCOMMERCE_CREDENTIALS_REJECTED',
  'WOOCOMMERCE_PERMISSION_DENIED',
  'WOOCOMMERCE_STORE_URL_MISMATCH',
  'WOOCOMMERCE_WEBHOOK_SETUP_FAILED',
  'WOOCOMMERCE_STORE_UNAVAILABLE',
] as const

/** Everything else the merchant's screen can be told. */
const WOOCOMMERCE_OTHER_ERROR_CODES = [
  'WOOCOMMERCE_PROVIDER_UNAVAILABLE',
  'WOOCOMMERCE_SOURCE_EXISTS',
  'WOOCOMMERCE_PILOT_REQUIRED',
  'WOOCOMMERCE_CONNECT_UNAVAILABLE',
  'WOOCOMMERCE_ROLE_REQUIRED',
  'WOOCOMMERCE_CALLBACK_INVALID',
  'WOOCOMMERCE_INSTALL_VALIDATION_FAILED',
  'WOOCOMMERCE_RECONNECT_STORE_MISMATCH',
  'WOOCOMMERCE_NOT_CONNECTED',
  'WOOCOMMERCE_WEBHOOK_MISSING',
  'WOOCOMMERCE_WEBHOOK_ENABLE_UNAVAILABLE',
  'WOOCOMMERCE_WEBHOOK_ENABLE_FAILED',
] as const

/** Codes with their own message under `wooCommerceConnect.codes`. */
export const WOOCOMMERCE_ERROR_CODES = [
  ...WOOCOMMERCE_UNSUPPORTED_STORE_CODES,
  ...WOOCOMMERCE_OTHER_ERROR_CODES,
] as const

export type WooCommerceErrorCode = (typeof WOOCOMMERCE_ERROR_CODES)[number]

export function toWooCommerceErrorKey(
  code: string | null | undefined
): WooCommerceErrorCode | 'default' {
  return WOOCOMMERCE_ERROR_CODES.find((known) => known === code) ?? 'default'
}

/** True for a code with no message of its own, such as a network failure. */
export function isUnnamedWooCommerceError(
  code: string | null | undefined
): boolean {
  return toWooCommerceErrorKey(code) === 'default'
}

export function isUnsupportedStoreCode(
  code: string | null | undefined
): boolean {
  return WOOCOMMERCE_UNSUPPORTED_STORE_CODES.some((known) => known === code)
}

/**
 * What a connection check can find, each with its own guidance under
 * `wooCommerceConnect.check.problems`. The wording there is about a store
 * that is already connected, so it is kept apart from the connect codes.
 */
export const WOOCOMMERCE_CHECK_PROBLEMS = [
  'WOOCOMMERCE_STORE_ADDRESS_NOT_PUBLIC',
  'WOOCOMMERCE_STORE_REDIRECTS',
  'WOOCOMMERCE_STORE_TLS_FAILED',
  'WOOCOMMERCE_REST_NOT_FOUND',
  'WOOCOMMERCE_REST_UNREACHABLE',
  'WOOCOMMERCE_PROVIDER_UNAVAILABLE',
  'WOOCOMMERCE_CREDENTIALS_REJECTED',
  'WOOCOMMERCE_PERMISSION_DENIED',
  'WOOCOMMERCE_STORE_URL_MISMATCH',
  'WOOCOMMERCE_WEBHOOK_MISSING',
  'WOOCOMMERCE_WEBHOOK_DISABLED',
  'WOOCOMMERCE_WEBHOOK_PAUSED',
] as const

export type WooCommerceCheckProblem =
  (typeof WOOCOMMERCE_CHECK_PROBLEMS)[number]

export function toWooCommerceCheckKey(
  code: string | null | undefined
): WooCommerceCheckProblem | 'default' {
  return WOOCOMMERCE_CHECK_PROBLEMS.find((known) => known === code) ?? 'default'
}

/** True while a reconnect of a disconnected source is waiting or was refused. */
export function isWooCommerceReconnect(
  status: WooCommerceConnectionStatus | null
): boolean {
  return Boolean(status?.connection?.disconnectedAt)
}

/** True when the store last had at least one of Akeed's webhooks in `state`. */
export function hasWebhookIn(
  connection: Pick<WooCommerceConnectionDetails, 'webhooks'> | null | undefined,
  state: WooCommerceWebhookState
): boolean {
  return Boolean(
    connection?.webhooks.some((webhook) => webhook.state === state)
  )
}

export const WOOCOMMERCE_CHECKLIST_ITEMS = [
  'store',
  'notifications',
  'sender',
] as const

export type WooCommerceChecklistItemId =
  (typeof WOOCOMMERCE_CHECKLIST_ITEMS)[number]

export interface WooCommerceChecklistItem {
  id: WooCommerceChecklistItemId
  done: boolean
}

/**
 * What must be in place before the test message, each on its own row. There
 * is no currency or phone country to choose: every order carries its own. A
 * notification the store disabled holds setup back; the sender is Akeed's, so
 * only a deployment that reports it is not configured does.
 */
export function buildWooCommerceChecklist(
  connection: Pick<WooCommerceConnectionDetails, 'webhooks'>,
  senderStatus: 'configured' | 'not_configured' | 'unknown'
): WooCommerceChecklistItem[] {
  return [
    { id: 'store', done: true },
    { id: 'notifications', done: !hasWebhookIn(connection, 'disabled') },
    { id: 'sender', done: senderStatus !== 'not_configured' },
  ]
}

/**
 * `restarting` is the merchant choosing to enter an address again; it never
 * hides a connection that exists. A reconnect has no address to enter: its
 * store is fixed, so starting again goes back to the disconnected screen.
 */
export function resolveWooCommerceConnectView(
  status: WooCommerceConnectionStatus | null,
  options: {
    isLoading: boolean
    loadFailed: boolean
    returnHint: WooCommerceReturnHint
    restarting: boolean
  }
): WooCommerceConnectView {
  if (!status) {
    if (options.loadFailed) return 'loadError'
    return options.isLoading ? 'loading' : 'loadError'
  }
  switch (status.state) {
    case 'connected':
      return status.connection && status.connection.health !== 'ok'
        ? 'credentialsRejected'
        : 'connected'
    case 'disconnected':
      return 'disconnected'
    case 'unavailable':
      return 'unavailable'
    case 'pilot_required':
      return 'pilotRequired'
    case 'source_exists':
      return 'sourceExists'
    default:
      break
  }
  if (options.restarting)
    return isWooCommerceReconnect(status) ? 'disconnected' : 'enterUrl'
  switch (status.state) {
    case 'failed':
      return isUnsupportedStoreCode(status.lastErrorCode)
        ? 'unsupported'
        : 'error'
    case 'expired':
      return 'error'
    case 'pending':
      return options.returnHint === 'denied' ? 'denied' : 'waiting'
    default:
      return options.returnHint === 'denied' ? 'denied' : 'enterUrl'
  }
}
