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

/** The store's currency and the country its local phone numbers are read in. */
export function saveEasyOrdersOrderSettings(
  settings: EasyOrdersOrderSettings
): Promise<EasyOrdersConnectionStatus> {
  return api.put<EasyOrdersConnectionStatus>(
    '/api/easyorders/connection/order-settings',
    settings
  )
}

/** Write-only: the response says the secrets are set, never what they are. */
export function saveEasyOrdersWebhookSecrets(
  secrets: EasyOrdersWebhookSecrets
): Promise<EasyOrdersConnectionStatus> {
  return api.put<EasyOrdersConnectionStatus>(
    '/api/easyorders/connection/webhook-secrets',
    secrets
  )
}
