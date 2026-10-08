'use client'

import {
  DisconnectSourceDialog,
  type DisconnectSourceDialogProps,
} from '../connect/DisconnectSourceDialog'

const EFFECTS = ['stops', 'history', 'provider', 'reconnect'] as const

/**
 * Asks before disconnecting. It says what stops at once, what is kept, what
 * Akeed removes at EasyOrders and what stays there for the merchant.
 */
export function DisconnectEasyOrdersDialog(props: DisconnectSourceDialogProps) {
  return (
    <DisconnectSourceDialog
      {...props}
      namespace="easyOrdersConnect.disconnect"
      effects={EFFECTS}
    />
  )
}
