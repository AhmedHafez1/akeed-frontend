import type { VerificationItem } from '../model/dashboard.model'
import { canCancelOrder } from './cancellation'
import { autoCancelToggleAction } from './autoCancel'
import { canSendShippingInfo } from './confirmationRowStatus'
import { isShippingReason } from './shippingStatus'
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
  /**
   * "Mark done" for an open delivery request or an unreached customer after
   * shipping. Owner and admin only, as the server enforces.
   */
  canMarkShippingDone: boolean
}

/** Reasons where WhatsApp is what failed, so there is no chat to offer. */
const NO_CHAT_REASONS: ReadonlySet<string> = new Set([
  'delivery_failed',
  'no_whatsapp',
  'shipping_not_reachable',
])

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
      canMarkShippingDone: false,
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
      canMarkShippingDone: false,
    }
  }

  // No chat where the message never arrived: a failed delivery, a number
  // that is not on WhatsApp at all, or a Shipped message that could not
  // reach the customer.
  const primary =
    row.action_reason && !NO_CHAT_REASONS.has(row.action_reason)
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
    canMarkShippingDone:
      permissions.canWrite && isShippingReason(row.action_reason),
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
  /** "Mark done" on a shipping row; the item shows only when it is wired. */
  onMarkShippingDone?: (row: VerificationItem) => void
}
