import type {
  NeedsActionReason,
  ShippingFailureReason,
  ShippingSummary,
} from '../model/dashboard.model'

/**
 * How the Shipping cell words a Shipped message. Owner rule: a customer
 * WhatsApp cannot reach is "WhatsApp undeliverable"; a real problem is
 * "Failed to send"; an order Akeed rightly skipped is "Not sent".
 */
export type ShippingBadge =
  | 'sent'
  | 'undeliverable'
  | 'failedToSend'
  | 'notSent'

export interface ShippingCellView {
  badge: ShippingBadge
  /** Key under `dashboard.shipping.reasons`, for the tooltip; null without one. */
  reason: ShippingFailureReason | null
}

const KNOWN_REASONS: ReadonlySet<string> = new Set<ShippingFailureReason>([
  'no_phone',
  'not_on_whatsapp',
  'no_allowance',
  'order_too_old',
  'order_cancelled',
  'send_failed',
  'template_unavailable',
])

function knownReason(code: string | null): ShippingFailureReason | null {
  return code && KNOWN_REASONS.has(code)
    ? (code as ShippingFailureReason)
    : null
}

/** The badge a failure reason wears. An unknown code is a plain failure. */
export function shippingFailureBadge(
  reason: ShippingFailureReason | null
): Exclude<ShippingBadge, 'sent'> {
  if (reason === 'no_phone' || reason === 'not_on_whatsapp')
    return 'undeliverable'
  if (reason === 'order_too_old' || reason === 'order_cancelled')
    return 'notSent'
  return 'failedToSend'
}

/** Whether the Shipped message went out: accepted, delivered or read. */
export function isShippingSent(shipping: ShippingSummary | null | undefined) {
  return (
    shipping?.status === 'sent' ||
    shipping?.status === 'delivered' ||
    shipping?.status === 'read'
  )
}

/**
 * The one-line Shipping cell. Blank (null) when nothing was due or the
 * message is still pending.
 */
export function shippingCellView(
  shipping: ShippingSummary | null | undefined
): ShippingCellView | null {
  if (!shipping) return null
  if (isShippingSent(shipping)) return { badge: 'sent', reason: null }
  if (shipping.status !== 'failed') return null
  const reason = knownReason(shipping.reason_code)
  return { badge: shippingFailureBadge(reason), reason }
}

/** What the customer's open request asks for; null when none is open. */
export function shippingRequestKind(
  shipping: ShippingSummary | null | undefined
): 'reschedule' | 'address' | null {
  if (!shipping?.delivery_request) return null
  return shipping.customer_reply === 'address' ? 'address' : 'reschedule'
}

/**
 * A reason the merchant settles with "Mark done": an open delivery request,
 * or a Shipped message that could not reach the customer.
 */
export function isShippingReason(
  reason: NeedsActionReason | null | undefined
): reason is 'delivery_request' | 'shipping_not_reachable' {
  return reason === 'delivery_request' || reason === 'shipping_not_reachable'
}

/** A tracking link only when it is https; anything else is shown as text. */
export function safeTrackingUrl(url: string | null | undefined): string | null {
  return url && /^https:\/\//i.test(url) ? url : null
}

/**
 * Whether a phone card shows its Shipping line. Not when the card's status
 * already says the Shipped message could not reach the customer.
 */
export function showsShippingLine(row: {
  action_reason?: NeedsActionReason | null
  shipping?: ShippingSummary | null
}): boolean {
  return (
    shippingCellView(row.shipping) !== null &&
    row.action_reason !== 'shipping_not_reachable'
  )
}
