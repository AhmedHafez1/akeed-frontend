import type {
  DashboardStats,
  DashboardStatsDateRange,
  DashboardSourceStatus,
  VerificationItem,
  VerificationStatusFilter,
} from '../model/dashboard.model'

export interface StatusFilterOption {
  id: VerificationStatusFilter
  label: string
}

export interface DateRangeFilterOption {
  id: DashboardStatsDateRange
  label: string
}

export type TestBannerTone = 'success' | 'critical' | 'warning'

export interface TestFeedback {
  tone: TestBannerTone
  message: string
}

/**
 * The single contract both dashboard skins render.
 *
 * There used to be two — one verification-shaped for embedded, one
 * order-shaped for standalone — which is how the two modes ended up with
 * different columns, filters and actions for the same data. One shape means a
 * capability added here appears in both tables or neither.
 */
export interface DashboardSkinProps {
  // Stats
  stats: DashboardStats | null
  isStatsLoading: boolean
  isAutoVerifyEnabled: boolean
  followUpEnabled: boolean
  quietHoursEnabled: boolean
  sourceStatus: DashboardSourceStatus
  /** IANA zone every row's dates are formatted in, in both modes. */
  reportingTimezone: string
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void

  // Verifications
  verifications: VerificationItem[]
  totalCount: number
  isVerificationsLoading: boolean
  hasMoreVerifications: boolean
  isLoadingMoreVerifications: boolean
  onLoadMoreVerifications: () => Promise<void>
  hasVerifications: boolean
  emptyVerificationsMessage: string

  // Row actions
  actingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  actionErrors: Record<string, string>
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onRetryVerification: (verificationId: string) => Promise<void>

  // Status filter controls
  statusFilter: VerificationStatusFilter
  statusFilters: ReadonlyArray<StatusFilterOption>
  onStatusFilterChange: (filter: VerificationStatusFilter) => void

  // Permissions
  canSendTestVerification: boolean
  canCancelOrders: boolean
  canCreateManualOrder: boolean
  canRetryVerifications: boolean

  // Test verification + action feedback
  isSendingTest: boolean
  testFeedback: TestFeedback | null
  actionFeedback: TestFeedback | null
  onSendTestVerification: (customerPhone: string) => Promise<void>
  onDismissTestFeedback: () => void
  onDismissActionFeedback: () => void
  onManualOrderAccepted: () => void

  // Errors
  error: string | null
}
