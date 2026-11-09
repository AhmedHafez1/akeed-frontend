import type { VerificationItem } from '../model/dashboard.model'
import { canCancelOrder } from './cancellation'
import { autoCancelToggleAction } from './autoCancel'
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
  /**
   * The customer asked for a change: the row is handled from its details,
   * where the change request's own outcomes are, never with the plain
   * confirm and cancel.
   */
  handle: boolean
  canConfirm: boolean
  canRetry: boolean
  canCancel: boolean
  /** Keep the order out of the automatic cancellation, or let it back in. */
  autoCancelToggle: 'exclude' | 'include' | null
}

export function planConfirmationRowActions(
  row: VerificationItem,
  permissions: { canWrite: boolean; canRetry: boolean }
): ConfirmationRowActionPlan {
  // A row the UI shows ahead of the server has nothing to act on yet.
  if (row.optimistic) {
    return {
      primary: null,
      handle: false,
      canConfirm: false,
      canRetry: false,
      canCancel: false,
      autoCancelToggle: null,
    }
  }

  if (row.change_request) {
    return {
      primary: 'chat',
      handle: true,
      canConfirm: false,
      canRetry: false,
      canCancel: false,
      autoCancelToggle: null,
    }
  }

  // No chat where the message never arrived: a failed delivery, or a
  // number that is not on WhatsApp at all.
  const primary =
    row.action_reason &&
    row.action_reason !== 'delivery_failed' &&
    row.action_reason !== 'no_whatsapp'
      ? 'chat'
      : canSendShippingInfo(row)
        ? 'shipping'
        : null

  return {
    primary,
    handle: false,
    canConfirm:
      permissions.canWrite &&
      Boolean(row.action_reason) &&
      hasCapability(row.capabilities, 'merchant_manual_confirmation'),
    canRetry: permissions.canRetry && canRetryVerification(row.capabilities),
    canCancel: permissions.canWrite && canCancelOrder(row),
    autoCancelToggle: permissions.canWrite ? autoCancelToggleAction(row) : null,
  }
}

/** What a skin calls when the merchant picks one of a row's actions. */
export interface ConfirmationRowActionHandlers {
  onRequestConfirm: (row: VerificationItem, orderLabel: string) => void
  onRequestCancel: (row: VerificationItem, orderLabel: string) => void
  onRetry: (row: VerificationItem) => void
  onToggleAutoCancel: (
    row: VerificationItem,
    action: 'exclude' | 'include'
  ) => void
}
