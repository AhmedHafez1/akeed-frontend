'use client'

import { useVerificationsDashboard } from './useVerificationsDashboard'
import type { VerificationStatusFilter } from '../model/dashboard.model'

/**
 * Standalone entry point.
 *
 * Owns its own date range (the portal has no shared tab strip) and otherwise
 * renders exactly what the embedded dashboard renders.
 */
export function useDashboard(
  initialStatusFilter: VerificationStatusFilter = 'all'
) {
  return useVerificationsDashboard({ initialStatusFilter })
}
