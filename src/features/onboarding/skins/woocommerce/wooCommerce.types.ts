export type WooCommerceConnectionState =
  | 'unavailable'
  | 'pilot_required'
  | 'source_exists'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'connected'

/** Never carries a key, a secret, a token or the authorize link. */
export interface WooCommerceConnectionStatus {
  state: WooCommerceConnectionState
  canManage: boolean
  organizationName: string | null
  /** The canonical address of the store connected, or being connected. */
  storeUrl: string | null
  expiresAt: string | null
  lastErrorCode: string | null
  connection: {
    storeUrl: string
    health: 'ok' | 'credentials_rejected' | 'permission_denied'
    connectedAt: string
  } | null
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

export function isUnsupportedStoreCode(
  code: string | null | undefined
): boolean {
  return WOOCOMMERCE_UNSUPPORTED_STORE_CODES.some((known) => known === code)
}

/**
 * `restarting` is the merchant choosing to enter an address again; it never
 * hides a connection that exists.
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
      return 'connected'
    case 'unavailable':
      return 'unavailable'
    case 'pilot_required':
      return 'pilotRequired'
    case 'source_exists':
      return 'sourceExists'
    default:
      break
  }
  if (options.restarting) return 'enterUrl'
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
