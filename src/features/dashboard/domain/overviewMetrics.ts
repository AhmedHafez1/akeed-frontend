import type { DashboardOverview } from '../model/dashboard.model'

/**
 * Orders the merchant confirmed by hand.
 *
 * The flow's "Confirmed" counts only customers who confirmed by replying.
 * The backend counts manual confirmations directly, because a failed send has
 * no recorded send and so never shows in the send-based confirmation rate.
 */
export function manualConfirmationsAfterSend(
  overview: Pick<DashboardOverview, 'funnel'>
): number {
  const count = overview.funnel.manually_confirmed ?? 0
  return Number.isFinite(count) ? Math.max(count, 0) : 0
}
