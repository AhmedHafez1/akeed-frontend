import type {
  OrderImportBatchDetail,
  OrderImportLifecycleCounts,
  OrderImportStartBlocker,
  OrderImportStartQuote,
} from '../api/orderImportsApi'

/** Minutes split for display as "2 h 5 min" or "49 min". */
export function splitDuration(totalMinutes: number): {
  hours: number
  minutes: number
} {
  const safe = Math.max(Math.ceil(totalMinutes), 0)
  return { hours: Math.floor(safe / 60), minutes: safe % 60 }
}

/** The credit blocker, if the quote has one: it replaces the start button. */
export function shortfallOf(
  quote: OrderImportStartQuote
): OrderImportStartBlocker | undefined {
  return quote.blockers.find(
    (blocker) =>
      blocker.code === 'INSUFFICIENT_CREDITS' &&
      (blocker.suggestedPurchaseCredits ?? 0) > 0
  )
}

export function balanceAfterFirstMessages(
  quote: OrderImportStartQuote
): number | null {
  return quote.creditsAvailable === null
    ? null
    : quote.creditsAvailable - quote.estimatedCreditsMin
}

export type ReleaseProgress = {
  /** Orders whose send has an outcome: sent (or later) or failed. */
  settled: number
  /** Orders that reached WhatsApp; `settled` minus the failures. */
  delivered: number
  failed: number
  /** Still held, or released but not yet sent by the worker. */
  queued: number
  total: number
  /** Still held back by the paced release; what a stop would withdraw. */
  held: number
  percent: number
}

const emptyLifecycle: OrderImportLifecycleCounts = {
  queued: 0,
  sent: 0,
  confirmed: 0,
  canceled: 0,
  noReply: 0,
  failed: 0,
}

/**
 * Progress counts send outcomes from the same lifecycle projection the
 * confirmations list shows, never the hold release: a released order has
 * only been handed to the queue, and its send can still fail (bug 3.1).
 * Withdrawn orders are never counted.
 */
export function releaseProgress(
  detail: Pick<OrderImportBatchDetail, 'lifecycle' | 'release'>
): ReleaseProgress {
  const lifecycle = detail.lifecycle ?? emptyLifecycle
  const delivered =
    lifecycle.sent +
    lifecycle.confirmed +
    lifecycle.canceled +
    lifecycle.noReply
  const settled = delivered + lifecycle.failed
  const total = settled + lifecycle.queued
  return {
    settled,
    delivered,
    failed: lifecycle.failed,
    queued: lifecycle.queued,
    total,
    held: detail.release?.held ?? 0,
    percent: total === 0 ? 0 : Math.round((settled / total) * 100),
  }
}

/**
 * The release finished handing orders over, but some sends have no outcome
 * yet. The batch reads `completed` or `stopped` while this is true.
 */
export function isSettling(
  detail: Pick<OrderImportBatchDetail, 'status' | 'lifecycle'>
): boolean {
  return (
    (detail.status === 'completed' || detail.status === 'stopped') &&
    (detail.lifecycle?.queued ?? 0) > 0
  )
}

/** Minutes left at the organization's pace, ignoring future quiet hours. */
export function minutesLeft(detail: OrderImportBatchDetail): number {
  const rate = detail.ratePerMinute ?? 0
  const held = detail.release?.held ?? 0
  return rate > 0 ? Math.ceil(held / rate) : 0
}

/**
 * Quiet hours are holding sending back. The release job sets the instant on
 * each quiet tick and clears it on the first tick outside the window, so its
 * presence alone is the signal.
 */
export function isWaitingOutQuietHours(
  detail: OrderImportBatchDetail
): boolean {
  return detail.status === 'releasing' && !!detail.quietHoursUntil
}

/** Where Buy credits sends the merchant back to after paying. */
export function importReturnPath(batchId: string, reopenStart: boolean) {
  return `/imports/${batchId}${reopenStart ? '?start=1' : ''}`
}
