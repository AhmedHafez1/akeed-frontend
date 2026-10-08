'use client'

import {
  DisconnectSourceDialog,
  type DisconnectSourceDialogProps,
} from '../connect/DisconnectSourceDialog'

const EFFECTS = ['stops', 'history', 'webhooks', 'key', 'reconnect'] as const

/**
 * Asks before disconnecting. It says what stops at once, what is kept, what
 * Akeed removes from the store itself and what stays there until the
 * merchant revokes it: the API key.
 */
export function DisconnectWooCommerceDialog(
  props: DisconnectSourceDialogProps
) {
  return (
    <DisconnectSourceDialog
      {...props}
      namespace="wooCommerceConnect.disconnect"
      effects={EFFECTS}
    />
  )
}
