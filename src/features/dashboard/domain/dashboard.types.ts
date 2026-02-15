import type {
  DashboardStats,
  DashboardStatsDateRange,
  VerificationItem,
  VerificationStatusFilter,
} from '@/types/dashboard.model'

export interface StatusFilterOption {
  id: VerificationStatusFilter
  label: string
}

export interface DateRangeFilterOption {
  id: DashboardStatsDateRange
  label: string
}

export interface DashboardSkinProps {
  // Stats
  stats: DashboardStats | null
  isStatsLoading: boolean
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void

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
