import type { VerificationItem } from '../model/dashboard.model'
import { canCancelOrder } from './cancellation'
import { canSendShippingInfo } from './confirmationRowStatus'
import { canRetryVerification, hasCapability } from './verificationLifecycle'

/**
 * What a confirmations row offers, decided once for both skins.
 *
 * One WhatsApp link up front: a chat for a row waiting on the merchant (not
 * for a failed delivery, where WhatsApp is the problem), shipping details for
 * a real confirmed order. The rarer actions sit behind a "more" control. A
 * skin chooses how these look; it never decides whether they exist.
 */
export interface ConfirmationRowActionPlan {
  primary: 'chat' | 'shipping' | null
  canConfirm: boolean
  canRetry: boolean
  canCancel: boolean
}

export function planConfirmationRowActions(
  row: VerificationItem,
  permissions: { canWrite: boolean; canRetry: boolean }
): ConfirmationRowActionPlan {
  // A row the UI shows ahead of the server has nothing to act on yet.
  if (row.optimistic) {
    return {
      primary: null,
      canConfirm: false,
      canRetry: false,
      canCancel: false,
    }
  }

  const primary =
    row.action_reason && row.action_reason !== 'delivery_failed'
      ? 'chat'
      : canSendShippingInfo(row)
        ? 'shipping'
        : null

  return {
    primary,
    canConfirm:
      permissions.canWrite &&
      Boolean(row.action_reason) &&
      hasCapability(row.capabilities, 'merchant_manual_confirmation'),
    canRetry: permissions.canRetry && canRetryVerification(row.capabilities),
    canCancel: permissions.canWrite && canCancelOrder(row),
  }
}

/** What a skin calls when the merchant picks one of a row's actions. */
export interface ConfirmationRowActionHandlers {
  onRequestConfirm: (row: VerificationItem, orderLabel: string) => void
  onRequestCancel: (row: VerificationItem, orderLabel: string) => void
  onRetry: (row: VerificationItem) => void
}
