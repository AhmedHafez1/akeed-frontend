'use client'

import { api } from '@/shared/lib/auth'
import type {
  WooCommerceConnectionCheck,
  WooCommerceConnectionStatus,
  WooCommerceDisconnected,
  WooCommerceInstallStarted,
} from './wooCommerce.types'

export function fetchWooCommerceConnection(): Promise<WooCommerceConnectionStatus> {
  return api.get<WooCommerceConnectionStatus>('/api/woocommerce/connection', {
    cache: 'no-store',
  })
}

/**
 * Checks the store and opens a single-use install request for the caller's
 * organization. The returned link is a credential: it is navigated to, never
 * shown or stored.
 */
export function startWooCommerceInstall(
  storeUrl: string,
  locale: 'ar' | 'en'
): Promise<WooCommerceInstallStarted> {
  return api.post<WooCommerceInstallStarted>('/api/woocommerce/install', {
    storeUrl,
    locale,
  })
}

/**
 * Stops the source on Akeed's side, wipes the stored keys and asks the store
 * to delete Akeed's order notifications. The answer says whether the store
 * did. The API key in the store is the merchant's to revoke.
 */
export function disconnectWooCommerce(): Promise<WooCommerceDisconnected> {
  return api.delete<WooCommerceDisconnected>('/api/woocommerce/connection')
}

/** Asks the store about the connection; answers with what it found. */
export function checkWooCommerceConnection(): Promise<WooCommerceConnectionCheck> {
  return api.post<WooCommerceConnectionCheck>(
    '/api/woocommerce/connection/check',
    {}
  )
}

/** Sets the order notifications the store disabled back to active. */
export function enableWooCommerceWebhooks(): Promise<WooCommerceConnectionStatus> {
  return api.post<WooCommerceConnectionStatus>(
    '/api/woocommerce/connection/webhooks/enable',
    {}
  )
}
