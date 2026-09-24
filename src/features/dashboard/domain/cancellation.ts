import type { VerificationItem } from '../model/dashboard.model'
import { canMarkOrderCanceled } from './verificationLifecycle'

export function canCancelOrder(verification: VerificationItem): boolean {
  return canMarkOrderCanceled(
    verification.status,
    verification.action_reason,
    verification.capabilities
  )
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
