'use client'

import {
  DisconnectSourceDialog,
  type DisconnectSourceDialogProps,
} from '../connect/DisconnectSourceDialog'

const EFFECTS = ['stops', 'history', 'provider', 'reconnect'] as const

/**
 * Asks before disconnecting. It says what stops at once, what is kept, and
 * what stays at EasyOrders until the merchant removes it there.
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
