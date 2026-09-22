import type {
  OrderImportBatchDetail,
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

/** Released of those still meant to be sent; withdrawn orders never count. */
export function releaseProgress(detail: OrderImportBatchDetail): {
  released: number
  total: number
  held: number
  percent: number
} {
  const release = detail.release ?? {
    total: 0,
    held: 0,
    released: 0,
    withdrawn: 0,
  }
  const total = release.released + release.held
  return {
    released: release.released,
    total,
    held: release.held,
    percent: total === 0 ? 0 : Math.round((release.released / total) * 100),
  }
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
