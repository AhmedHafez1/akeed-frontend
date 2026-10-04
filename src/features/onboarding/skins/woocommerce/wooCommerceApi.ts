'use client'

import { api } from '@/shared/lib/auth'
import type {
  WooCommerceConnectionStatus,
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
