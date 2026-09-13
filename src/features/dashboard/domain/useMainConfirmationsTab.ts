'use client'

import {
  useVerificationsDashboard,
  type UseVerificationsDashboardOptions,
} from './useVerificationsDashboard'
import type { DashboardStatsDateRange } from '../model/dashboard.model'

/**
 * Embedded entry point.
 *
 * The embedded shell owns the date range because its metrics and confirmations
 * tabs share one selection; everything else comes from the shared hook, so the
 * embedded table and the standalone table cannot drift apart.
 */
export function useMainConfirmationsTab(
  dateRangeFilter: DashboardStatsDateRange,
  onDateRangeFilterChange?: UseVerificationsDashboardOptions['onDateRangeFilterChange']
) {
  return useVerificationsDashboard({
    dateRangeFilter,
    onDateRangeFilterChange,
  })
}
