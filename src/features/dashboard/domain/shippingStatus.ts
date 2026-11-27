import type {
  NeedsActionReason,
  ShippingFailureReason,
  ShippingSummary,
} from '../model/dashboard.model'
import type { RowStatusKind } from './confirmationRowStatus'

/**
 * How a Shipped message itself went. Owner rule: a customer WhatsApp cannot
 * reach is "WhatsApp undeliverable"; a real problem is "Failed to send"; an
 * order Akeed rightly skipped is "Not sent".
 */
export type ShippingDeliveryBadge =
  | 'sent'
  | 'undeliverable'
  | 'failedToSend'
  | 'notSent'

/**
 * What the Shipping cell says: the customer's reply once there is one,
 * otherwise how the message went.
 */
export type ShippingBadge =
  | ShippingDeliveryBadge
  | 'willReceive'
  | 'notAvailable'
  | 'changeAddress'

export interface ShippingDeliveryView {
  badge: ShippingDeliveryBadge
  /** Key under `dashboard.shipping.reasons`, for the tooltip; null without one. */
  reason: ShippingFailureReason | null
}

export interface ShippingCellView {
  badge: ShippingBadge
  /** Key under `dashboard.shipping.reasons`, for the tooltip; null without one. */
  reason: ShippingFailureReason | null
  /** The merchant marked the request, or the unreached customer, done. */
  done: boolean
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
): Exclude<ShippingDeliveryBadge, 'sent'> {
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
 * How the Shipped message went, ignoring any reply. Null when nothing was
 * due or the message is still pending.
 */
export function shippingDeliveryView(
  shipping: ShippingSummary | null | undefined
): ShippingDeliveryView | null {
  if (!shipping) return null
  if (isShippingSent(shipping)) return { badge: 'sent', reason: null }
  if (shipping.status !== 'failed') return null
  const reason = knownReason(shipping.reason_code)
  return { badge: shippingFailureBadge(reason), reason }
}

/**
 * The one-line Shipping cell: the customer's reply once they tapped one,
 * otherwise how the message went. A request or an unreached customer the
 * merchant marked done keeps its word, greyed. Blank (null) when nothing was
 * due or the message is still pending.
 */
export function shippingCellView(
  shipping: ShippingSummary | null | undefined
): ShippingCellView | null {
  const delivery = shippingDeliveryView(shipping)
  if (!shipping || !delivery) return null
  const done = shipping.resolved_at !== null
  switch (shipping.customer_reply) {
    case 'address':
      return { badge: 'changeAddress', reason: null, done }
    case 'reschedule':
      return { badge: 'notAvailable', reason: null, done }
    case 'home':
      return { badge: 'willReceive', reason: null, done: false }
    default:
      return { ...delivery, done: delivery.badge === 'undeliverable' && done }
  }
}

/** The badge family a Shipping cell wears, the same as the status badges'. */
export function shippingCellKind(view: ShippingCellView): RowStatusKind {
  if (view.done) return 'scheduled'
  switch (view.badge) {
    case 'sent':
      return 'pending'
    case 'willReceive':
      return 'confirmed'
    case 'notAvailable':
    case 'changeAddress':
      return 'needsAction'
    case 'undeliverable':
      return 'noWhatsApp'
    case 'failedToSend':
      return 'failed'
    case 'notSent':
      return 'scheduled'
  }
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

/** Whether a phone card shows its Shipping line: whenever the cell would. */
export function showsShippingLine(row: {
  shipping?: ShippingSummary | null
}): boolean {
  return shippingCellView(row.shipping) !== null
}
