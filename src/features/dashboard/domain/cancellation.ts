import type { VerificationItem } from '../model/dashboard.model'
import { canMarkOrderCanceled } from './verificationLifecycle'

export function canCancelOrder(verification: VerificationItem): boolean {
  return canMarkOrderCanceled(verification.status, verification.capabilities)
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
