/**
 * Dashboard Skin Props Contract
 *
 * This interface is the SINGLE source of truth for the data shape
 * that every dashboard skin must accept. It enforces a clean boundary:
 *   - Domain hook (useDashboard) PRODUCES these props
 *   - Each skin component CONSUMES these props
 *   - No business logic lives inside any skin
 */

import type {
  VerificationItem,
  OrderItem,
  VerificationStatusFilter,
} from '@/types/dashboard.model'

// ─── Status filter descriptor ────────────────────────────────────────────────

export interface StatusFilterOption {
  /** Filter value sent to the API (e.g. 'all', 'pending') */
  id: VerificationStatusFilter
  /** Human-readable label rendered in the UI */
  label: string
}

// ─── Props contract shared by all skins ──────────────────────────────────────

export interface DashboardSkinProps {
  // Verifications
  verifications: VerificationItem[]
  isVerificationsLoading: boolean
  hasVerifications: boolean
  emptyVerificationsMessage: string

  // Status filter controls
  statusFilter: VerificationStatusFilter
  statusFilters: ReadonlyArray<StatusFilterOption>
  onStatusFilterChange: (filter: VerificationStatusFilter) => void

  // Errors
  error: string | null
}
