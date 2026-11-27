import type { VerificationItem } from '../model/dashboard.model'
import { isShippingSent } from './shippingStatus'
import { isAwaitingOutcome } from './verificationLifecycle'

/** While a customer may still answer the confirmation. */
export const AWAITING_POLL_INTERVAL_MS = 30_000
/** While a recent Shipped message may still get a reply. */
export const SHIPPING_REPLY_POLL_INTERVAL_MS = 60_000
/** How long after a Shipped message a reply is still watched for. */
export const SHIPPING_REPLY_WINDOW_MS = 24 * 60 * 60 * 1000

/** A Shipped message that went out recently and has no reply yet. */
function awaitsShippingReply(row: VerificationItem, now: number): boolean {
  const shipping = row.shipping
  if (!isShippingSent(shipping) || !shipping || shipping.customer_reply)
    return false
  const updatedAt = new Date(shipping.updated_at).getTime()
  return (
    Number.isFinite(updatedAt) && now - updatedAt < SHIPPING_REPLY_WINDOW_MS
  )
}

/**
 * How often the confirmations list refreshes itself: every 30 s while a
 * loaded order awaits a confirmation reply, every minute while a recent
 * Shipped message awaits one, otherwise not at all. A hidden tab does not
 * poll (React Query's default).
 */
export function confirmationsPollInterval(
  rows: VerificationItem[],
  now: number
): number | false {
  if (rows.some((row) => isAwaitingOutcome(row.status)))
    return AWAITING_POLL_INTERVAL_MS
  if (rows.some((row) => awaitsShippingReply(row, now)))
    return SHIPPING_REPLY_POLL_INTERVAL_MS
  return false
}
