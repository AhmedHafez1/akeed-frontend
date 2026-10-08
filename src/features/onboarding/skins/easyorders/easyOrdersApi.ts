'use client'

import { api } from '@/shared/lib/auth'
import type {
  EasyOrdersConnectionStatus,
  EasyOrdersInstallStarted,
  EasyOrdersOrderSettings,
  EasyOrdersWebhookSecrets,
} from './easyOrders.types'

export function fetchEasyOrdersConnection(): Promise<EasyOrdersConnectionStatus> {
  return api.get<EasyOrdersConnectionStatus>('/api/easyorders/connection', {
    cache: 'no-store',
  })
}

/**
 * Opens a single-use install request for the caller's organization. The
 * returned link is a credential: it is navigated to, never shown or stored.
 */
export function startEasyOrdersInstall(
  locale: 'ar' | 'en'
): Promise<EasyOrdersInstallStarted> {
  return api.post<EasyOrdersInstallStarted>('/api/easyorders/install', {
    locale,
  })
}

/**
 * Stops the source on Akeed's side, wipes the stored credentials and asks
 * EasyOrders to delete Akeed's webhooks. The answer's `providerCleanup` says
 * whether that worked; the API key is always the merchant's to delete.
 */
export function disconnectEasyOrders(): Promise<EasyOrdersConnectionStatus> {
  return api.delete<EasyOrdersConnectionStatus>('/api/easyorders/connection')
}

/** The store's currency and the country its local phone numbers are read in. */
export function saveEasyOrdersOrderSettings(
  settings: EasyOrdersOrderSettings
): Promise<EasyOrdersConnectionStatus> {
  return api.put<EasyOrdersConnectionStatus>(
    '/api/easyorders/connection/order-settings',
    settings
  )
}

/**
 * Forgets both webhook secrets, so Akeed learns them again from the next
 * order. For a merchant who recreated the webhooks in EasyOrders.
 */
export function resetEasyOrdersWebhookSecrets(): Promise<EasyOrdersConnectionStatus> {
  return api.delete<EasyOrdersConnectionStatus>(
    '/api/easyorders/connection/webhook-secrets'
  )
}

/**
 * The fallback for the learned secrets. Write-only: the response says the
 * secrets are set, never what they are.
 */
export function saveEasyOrdersWebhookSecrets(
  secrets: EasyOrdersWebhookSecrets
): Promise<EasyOrdersConnectionStatus> {
  return api.put<EasyOrdersConnectionStatus>(
    '/api/easyorders/connection/webhook-secrets',
    secrets
  )
}
