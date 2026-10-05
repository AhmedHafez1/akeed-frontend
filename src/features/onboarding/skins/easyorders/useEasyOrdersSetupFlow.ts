'use client'

import { useSourceSetupFlow } from '../connect/useSourceSetupFlow'
import {
  buildEasyOrdersChecklist,
  type EasyOrdersChecklistItemId,
  type EasyOrdersConnectionDetails,
} from './easyOrders.types'

/**
 * Finishing setup for a connected EasyOrders store: a checklist of what the
 * connection still needs, then the same free test and `/complete` every
 * other source uses. The flow itself is the shared one; EasyOrders supplies
 * its rows and says which of its inputs change what blocks the finish.
 */
export function useEasyOrdersSetupFlow(
  connection: EasyOrdersConnectionDetails | null,
  enabled: boolean
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
  })
}

export type EasyOrdersSetupFlow = ReturnType<typeof useEasyOrdersSetupFlow>
