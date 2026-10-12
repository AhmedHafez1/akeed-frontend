import type { CustomerHistory } from '../model/dashboard.model'

/**
 * How a customer's other orders with this merchant read at a glance.
 *
 * `risk` is a customer who let down at least as many orders as they
 * confirmed; `repeat` has confirmed before; `returning` has other orders with
 * no outcome yet. Counts only, never a judgement about the person.
 */
export type CustomerRecordKind = 'new' | 'repeat' | 'risk' | 'returning'

export interface CustomerRecord {
  kind: CustomerRecordKind
  otherOrders: number
  confirmed: number
  canceled: number
  noReply: number
  /** Canceled plus never answered. */
  unconfirmed: number
}

export function resolveCustomerRecord(
  history: CustomerHistory | null | undefined
): CustomerRecord | null {
  if (!history) return null
  const unconfirmed = history.canceled + history.no_reply
  const kind: CustomerRecordKind =
    history.other_orders === 0
      ? 'new'
      : unconfirmed > 0 && unconfirmed >= history.confirmed
        ? 'risk'
        : history.confirmed > 0
          ? 'repeat'
          : 'returning'
  return {
    kind,
    otherOrders: history.other_orders,
    confirmed: history.confirmed,
    canceled: history.canceled,
    noReply: history.no_reply,
    unconfirmed,
  }
}
