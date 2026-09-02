import type { VerificationItem } from '../model/dashboard.model'

export function canCancelOrder(verification: VerificationItem): boolean {
  return (
    verification.status === 'no_reply' &&
    (verification.capabilities === undefined ||
      verification.capabilities.some(
        (capability) =>
          capability.action === 'merchant_no_reply_cancellation' &&
          capability.supported
      ))
  )
}

export function cancellationMessageKey(
  verification: VerificationItem
): string | undefined {
  if (verification.status === 'no_reply' && !canCancelOrder(verification))
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
