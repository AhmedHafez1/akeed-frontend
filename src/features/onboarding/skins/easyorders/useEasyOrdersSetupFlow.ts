'use client'

import { useSourceSetupFlow } from '../connect/useSourceSetupFlow'
import {
  buildEasyOrdersChecklist,
  hasEasyOrdersDetails,
  type EasyOrdersChecklistItemId,
  type EasyOrdersConnectionDetails,
} from './easyOrders.types'

/**
 * Finishing setup for a connected EasyOrders store: its country, currency
 * and webhook secrets on a step of their own, then the same number, free
 * test and `/complete` every other source uses. The flow itself is the
 * shared one; EasyOrders supplies its rows and says which of its inputs
 * change what blocks the finish.
 */
export function useEasyOrdersSetupFlow(
  connection: EasyOrdersConnectionDetails | null,
  enabled: boolean,
  isConnecting = false
) {
  // The setup inputs live on the connection; when one changes, what blocks
  // the finish changes with it.
  const connectionKey = connection
    ? [
        connection.currency,
        connection.phoneCountry,
        connection.ordersSecretSet,
        connection.statusSecretSet,
        connection.health,
      ].join('|')
    : null

  return useSourceSetupFlow<EasyOrdersChecklistItemId>({
    enabled,
    connectionKey,
    buildChecklist: (senderStatus) =>
      connection ? buildEasyOrdersChecklist(connection, senderStatus) : [],
    sourceName: 'EasyOrders',
    isConnecting,
    detailsComplete: connection ? hasEasyOrdersDetails(connection) : false,
  })
}

export type EasyOrdersSetupFlow = ReturnType<typeof useEasyOrdersSetupFlow>
