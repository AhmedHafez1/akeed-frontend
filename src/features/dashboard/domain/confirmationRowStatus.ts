import type { VerificationItem } from '../model/dashboard.model'
import { deliveryFailureKey } from './deliveryFailure'

export type RowStatusTone = 'success' | 'critical' | 'warning' | 'neutral'

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
  sub?: string
  /** An ISO time the sub-line interpolates as `{time}`. */
  subTime?: string
}

function isAfter(later: string | null, earlier: string | null): boolean {
  if (!later || !earlier) return false
  return new Date(later).getTime() > new Date(earlier).getTime()
}

export function resolveRowStatus(row: VerificationItem): RowStatusView {
  switch (row.status) {
    case 'confirmed':
      return {
        badge: 'confirmed',
        tone: 'success',
        sub:
          row.confirmation_source === 'merchant_manual'
            ? 'sub.manual'
            : isAfter(row.confirmed_at, row.follow_up_sent_at)
              ? 'sub.afterFollowUp'
              : undefined,
      }
    case 'canceled':
      return {
        badge:
          row.cancellation_source === 'merchant_no_reply'
            ? 'canceledNoReply'
            : 'canceledByCustomer',
        tone: 'critical',
        sub: row.canceled_in_store ? 'sub.canceledInStore' : undefined,
      }
    case 'failed':
      return {
        badge: 'failed',
        tone: 'critical',
        sub:
          row.reason === 'provider_delivery_failed'
            ? `failure.${deliveryFailureKey(row.failure_code)}`
            : 'failure.notSent',
      }
    case 'pending':
      return row.scheduled_for
        ? {
            badge: 'scheduled',
            tone: 'neutral',
            sub: 'sub.sendsAt',
            subTime: row.scheduled_for,
          }
        : { badge: 'sending', tone: 'neutral' }
    case 'awaiting_start':
      return { badge: 'awaitingStart', tone: 'neutral' }
    case 'not_started':
      return { badge: 'notStarted', tone: 'neutral' }
    default:
      break
  }

  if (row.action_reason || row.status === 'no_reply') {
    return {
      badge: 'noReply',
      tone: 'warning',
      sub: row.follow_up_sent_at ? 'sub.followUpSent' : undefined,
    }
  }
  return { badge: 'awaitingReply', tone: 'neutral' }
}

/** A row the merchant should act on gets the amber highlight. */
export function isNeedsActionRow(row: VerificationItem): boolean {
  return Boolean(row.action_reason)
}
