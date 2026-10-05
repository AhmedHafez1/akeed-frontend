'use client'

import { useSourceSetupFlow } from '../connect/useSourceSetupFlow'
import {
  buildWooCommerceChecklist,
  type WooCommerceChecklistItemId,
  type WooCommerceConnectionDetails,
} from './wooCommerce.types'

/**
 * Finishing setup for a connected WooCommerce store: the shared checklist,
 * free test and `/complete`, with the WooCommerce rows. There is no currency
 * or phone country to choose here, so what can change the finish is the
 * store's answer about the key and the state of the order notifications.
 */
export function useWooCommerceSetupFlow(
  connection: WooCommerceConnectionDetails | null,
  enabled: boolean
) {
  const connectionKey = connection
    ? [
        connection.health,
        ...connection.webhooks.map((webhook) => webhook.state),
      ].join('|')
    : null

  return useSourceSetupFlow<WooCommerceChecklistItemId>({
    enabled,
    connectionKey,
    buildChecklist: (senderStatus) =>
      connection ? buildWooCommerceChecklist(connection, senderStatus) : [],
    sourceName: 'WooCommerce',
  })
}

export type WooCommerceSetupFlow = ReturnType<typeof useWooCommerceSetupFlow>
