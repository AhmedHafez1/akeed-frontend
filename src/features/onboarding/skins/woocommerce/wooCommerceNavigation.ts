'use client'

/**
 * Sends the merchant to their store's approval page, in this tab: the store
 * sends them back to `return_url` when they are done. The link is a
 * credential, so it only ever passes through here.
 */
export function openStoreAuthorization(authorizeUrl: string): void {
  window.location.assign(authorizeUrl)
}
