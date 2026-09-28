import type {
  NeedsActionItem,
  VerificationItem,
} from '../model/dashboard.model'
import { canMarkOrderCanceled } from './verificationLifecycle'

export function canCancelOrder(verification: VerificationItem): boolean {
  return canMarkOrderCanceled(
    verification.status,
    verification.action_reason,
    verification.capabilities
  )
}

/**
 * The same rule for a dashboard "needs action" item, which carries its reason
 * rather than a lifecycle status: every such item is still open, so the
 * reason alone decides (a failed delivery is never cancellable as unanswered).
 */
export function canCancelNeedsActionItem(item: NeedsActionItem): boolean {
  return canMarkOrderCanceled('pending', item.reason.type, item.capabilities)
}

/** Unanswered, so cancellation would be offered if the source supported it. */
function isAwaitingCancellation(verification: VerificationItem): boolean {
  return canMarkOrderCanceled(
    verification.status,
    verification.action_reason,
    undefined
  )
}

export function cancellationMessageKey(
  verification: VerificationItem
): string | undefined {
  if (isAwaitingCancellation(verification) && !canCancelOrder(verification))
    return 'cancelOrderUnsupported'
  if (
    verification.cancellation_operation?.status === 'pending_provider_operation'
  )
    return 'cancelOrderPending'
  if (
    verification.cancellation_operation?.status === 'accepted_without_reference'
  )
    return 'cancelOrderUntracked'
  return undefined
}
