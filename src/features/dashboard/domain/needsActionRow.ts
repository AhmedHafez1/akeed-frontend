import { formatOrderNumber, whatsAppChatUrl } from '../lib/orderDisplay'
import type { NeedsActionItem } from '../model/dashboard.model'
import { canCancelNeedsActionItem } from './cancellation'
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
  status: { kind: 'needsAction' | 'failed'; badge: 'noReply' | 'failed' }
  /** Null when the message never arrived: there is no chat to continue. */
  chatUrl: string | null
  confirmable: boolean
  cancelable: boolean
}

export function needsActionRowModel(
  item: NeedsActionItem,
  { fallbackPrefix, canAct }: { fallbackPrefix: string; canAct: boolean }
): NeedsActionRowModel {
  const failed =
    item.reason.type === 'delivery_failed' || item.reason.type === 'send_failed'
  return {
    orderLabel:
      formatOrderNumber(item.order_number) ??
      `${fallbackPrefix} ${item.order_id.slice(0, 8)}`,
    status: failed
      ? { kind: 'failed', badge: 'failed' }
      : { kind: 'needsAction', badge: 'noReply' },
    chatUrl: failed ? null : whatsAppChatUrl(item.customer_phone),
    confirmable:
      canAct &&
      hasCapability(item.capabilities, 'merchant_manual_confirmation'),
    cancelable: canAct && canCancelNeedsActionItem(item),
  }
}
