import type { DashboardOverview } from '../model/dashboard.model'

/**
 * Orders the merchant confirmed by hand after a message went out.
 *
 * The flow's "Confirmed" counts only customers who confirmed by replying;
 * the confirmation rate counts every confirmed order that had a send,
 * whoever confirmed it. The difference is the manual confirmations — the
 * gap between the KPI and the flow the dashboard explains in the legend.
 */
export function manualConfirmationsAfterSend(
  overview: Pick<DashboardOverview, 'kpis' | 'funnel'>
): number {
  const difference =
    overview.kpis.confirmation_rate.confirmed - overview.funnel.confirmed
  return Number.isFinite(difference) ? Math.max(difference, 0) : 0
}
