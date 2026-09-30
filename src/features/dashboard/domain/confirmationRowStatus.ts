import type { VerificationItem } from '../model/dashboard.model'
import { deliveryFailureKey } from './deliveryFailure'

export type RowStatusTone = 'success' | 'critical' | 'warning' | 'neutral'

/**
 * Which of the standalone badge styles a status wears. Finer than the tone:
 * "awaiting reply" (info) and "scheduled" (neutral) share a tone but not a
 * look, and "canceled" and "failed" share one but not an icon.
 */
export type RowStatusKind =
  | 'pending'
  | 'needsAction'
  | 'confirmed'
  | 'canceled'
  | 'failed'
  | 'scheduled'

/**
 * What the status column shows for a row: one badge and an optional sub-line.
 *
 * Keys are relative to `dashboard.confirmations.status`; the sub-line may
 * carry a `time` parameter the view formats. Whether a row needs the merchant
 * is the server's `action_reason` — this only chooses the words for it.
 */
export interface RowStatusView {
  badge: string
  tone: RowStatusTone
  kind: RowStatusKind
  sub?: string
  /** An ISO time the sub-line interpolates as `{time}`. */
  subTime?: string
}

function isAfter(later: string | null, earlier: string | null): boolean {
  if (!later || !earlier) return false
  return new Date(later).getTime() > new Date(earlier).getTime()
}

export function resolveRowStatus(
  row: VerificationItem,
  options: { showStoreCancellation?: boolean } = {}
): RowStatusView {
  switch (row.status) {
    case 'confirmed':
      return {
        badge: 'confirmed',
        tone: 'success',
        kind: 'confirmed',
        sub:
          row.confirmation_source === 'merchant_manual'
            ? 'sub.manual'
            : isAfter(row.confirmed_at, row.follow_up_sent_at)
              ? 'sub.afterFollowUp'
              : undefined,
      }
    case 'canceled':
      // The badge is just "Canceled"; who canceled it is the sub-line.
      return {
        badge: 'canceled',
        tone: 'critical',
        kind: 'canceled',
        sub:
          options.showStoreCancellation && row.canceled_in_store
            ? 'sub.canceledInStore'
            : row.cancellation_source === 'merchant_no_reply'
              ? 'sub.canceledNoReply'
              : 'sub.canceledByCustomer',
      }
    case 'failed':
      return {
        badge: 'failed',
        tone: 'critical',
        kind: 'failed',
        sub:
          row.reason === 'provider_delivery_failed'
            ? `failure.${deliveryFailureKey(row.failure_code)}`
            : 'failure.notSent',
      }
    case 'queued':
    case 'sending':
    case 'pending':
      return row.scheduled_for
        ? {
            badge: 'scheduled',
            tone: 'neutral',
            kind: 'scheduled',
            sub: 'sub.sendsAt',
            subTime: row.scheduled_for,
          }
        : { badge: 'pending', tone: 'neutral', kind: 'pending' }
    case 'awaiting_start':
      return { badge: 'awaitingStart', tone: 'neutral', kind: 'scheduled' }
    case 'not_started':
      return { badge: 'notStarted', tone: 'neutral', kind: 'scheduled' }
    default:
      break
  }

  if (row.action_reason || row.status === 'no_reply') {
    return {
      badge: 'noReply',
      tone: 'warning',
      kind: 'needsAction',
    }
  }
  return { badge: 'awaitingReply', tone: 'neutral', kind: 'pending' }
}

/** A row the merchant should act on gets the amber highlight. */
export function isNeedsActionRow(row: VerificationItem): boolean {
  return Boolean(row.action_reason)
}

/**
 * A real confirmed order the merchant can follow up with shipping details.
 * The phone check stays with the link builder, which returns null without one.
 */
export function canSendShippingInfo(row: VerificationItem): boolean {
  return row.status === 'confirmed' && !row.is_test
}
