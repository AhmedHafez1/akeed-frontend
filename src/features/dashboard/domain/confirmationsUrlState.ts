import { DASHBOARD_DATE_RANGE_IDS } from './verificationFilters'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
} from '../model/dashboard.model'

/**
 * What the dashboard and confirmations pages keep in the URL, read back
 * safely. Both modes share it, so `?range=` and `?filter=` / `?tab=` mean the
 * same thing wherever a link lands.
 */

export const CONFIRMATIONS_TABS: ConfirmationsTab[] = [
  'all',
  'needs_action',
  'confirmed',
  'canceled',
  'failed',
]

export const DEFAULT_DASHBOARD_RANGE: DashboardStatsDateRange = 'last_30_days'

export function resolveDashboardRange(
  value: string | null | undefined
): DashboardStatsDateRange {
  return (DASHBOARD_DATE_RANGE_IDS as readonly string[]).includes(value ?? '')
    ? (value as DashboardStatsDateRange)
    : DEFAULT_DASHBOARD_RANGE
}

export function resolveConfirmationsTab(
  value: string | null | undefined
): ConfirmationsTab {
  return (CONFIRMATIONS_TABS as readonly string[]).includes(value ?? '')
    ? (value as ConfirmationsTab)
    : 'all'
}

/** The URL value for a range, omitted when it is the default. */
export function rangeParam(range: DashboardStatsDateRange): string | null {
  return range === DEFAULT_DASHBOARD_RANGE ? null : range
}
