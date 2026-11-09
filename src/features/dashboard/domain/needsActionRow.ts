import { formatOrderNumber, whatsAppChatUrl } from '../lib/orderDisplay'
import type { NeedsActionItem } from '../model/dashboard.model'
import { customerContact, type CustomerContact } from '../lib/customerContact'
import { canCancelNeedsActionItem } from './cancellation'
import { isAckMissing } from './changeRequestView'
import { hasCapability } from './verificationLifecycle'

/**
 * What a dashboard "needs your action" row shows and offers, derived once for
 * both modes: the order label, the status it wears (the confirmations table's
 * words: "No reply" or "Failed to send") and which actions exist.
 */
/** Orders the dashboard card lists at most; "All orders" holds the rest. */
export const NEEDS_ACTION_CARD_LIMIT = 3

export interface NeedsActionRowModel {
  orderLabel: string
  /** Keys under `dashboard.confirmations.status`, as the table uses them. */
  status: {
    kind: 'needsAction' | 'failed' | 'noWhatsApp'
    badge: 'noReply' | 'failed' | 'noWhatsApp' | 'changeRequested'
  }
  /** Null when the message never arrived: there is no chat to continue. */
  chatUrl: string | null
  confirmable: boolean
  cancelable: boolean
  /**
   * Set when the customer asked for a change: the row is handled from the
   * order's details (three outcomes there), never with the plain confirm and
   * cancel actions, and it must not ship meanwhile.
   */
  changeRequest: {
    /** The customer was not told the request arrived. */
    ackMissing: boolean
    /** WhatsApp, call and copy, or null without a usable number. */
    contact: CustomerContact | null
  } | null
}

export function needsActionRowModel(
  item: NeedsActionItem,
  { fallbackPrefix, canAct }: { fallbackPrefix: string; canAct: boolean }
): NeedsActionRowModel {
  const failed =
    item.reason.type === 'delivery_failed' || item.reason.type === 'send_failed'
  const noWhatsApp = item.reason.type === 'no_whatsapp'
  if (item.reason.type === 'change_requested') {
    const contact = customerContact(item.customer_phone)
    return {
      orderLabel:
        formatOrderNumber(item.order_number) ??
        `${fallbackPrefix} ${item.order_id.slice(0, 8)}`,
      status: { kind: 'needsAction', badge: 'changeRequested' },
      chatUrl: contact?.whatsAppUrl ?? null,
      confirmable: false,
      cancelable: false,
      changeRequest: {
        ackMissing: item.change_request
          ? isAckMissing(item.change_request)
          : false,
        contact,
      },
    }
  }
  return {
    orderLabel:
      formatOrderNumber(item.order_number) ??
      `${fallbackPrefix} ${item.order_id.slice(0, 8)}`,
    status: noWhatsApp
      ? { kind: 'noWhatsApp', badge: 'noWhatsApp' }
      : failed
        ? { kind: 'failed', badge: 'failed' }
        : { kind: 'needsAction', badge: 'noReply' },
    chatUrl: failed || noWhatsApp ? null : whatsAppChatUrl(item.customer_phone),
    confirmable:
      canAct &&
      hasCapability(item.capabilities, 'merchant_manual_confirmation'),
    cancelable: canAct && canCancelNeedsActionItem(item),
    changeRequest: null,
  }
}
