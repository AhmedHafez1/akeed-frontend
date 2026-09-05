import type {
  DashboardStats,
  DashboardStatsDateRange,
  DashboardSourceStatus,
  OrderItem,
  StandaloneDashboardStats,
  StandaloneOrderFilter,
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

export interface StandaloneOrderFilterOption {
  id: StandaloneOrderFilter
  label: string
}

export type TestBannerTone = 'success' | 'critical' | 'warning'

export interface TestFeedback {
  tone: TestBannerTone
  message: string
}

export interface DashboardSkinProps {
  // Stats
  stats: DashboardStats | null
  isStatsLoading: boolean
  isAutoVerifyEnabled: boolean
  followUpEnabled: boolean
  quietHoursEnabled: boolean
  sourceStatus: DashboardSourceStatus
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void

  // Verifications
  verifications: VerificationItem[]
  isVerificationsLoading: boolean
  hasMoreVerifications: boolean
  isLoadingMoreVerifications: boolean
  onLoadMoreVerifications: () => Promise<void>
  hasVerifications: boolean
  emptyVerificationsMessage: string
  cancelingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  cancelOrderErrors: Record<string, string>
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>

  // Status filter controls
  statusFilter: VerificationStatusFilter
  statusFilters: ReadonlyArray<StatusFilterOption>
  onStatusFilterChange: (filter: VerificationStatusFilter) => void

  // Test verification
  canSendTestVerification: boolean
  canCancelOrders: boolean
  canCreateManualOrder: boolean
  isSendingTest: boolean
  testFeedback: TestFeedback | null
  onSendTestVerification: (customerPhone: string) => Promise<void>
  onDismissTestFeedback: () => void

  // Errors
  error: string | null
}

export interface StandaloneDashboardSkinProps {
  stats: StandaloneDashboardStats | null
  reportingTimezone: string
  isStatsLoading: boolean
  isAutoVerifyEnabled: boolean
  sourceStatus: DashboardSourceStatus
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
  orders: OrderItem[]
  totalOrderCount: number
  isOrdersLoading: boolean
  hasMoreOrders: boolean
  isLoadingMoreOrders: boolean
  onLoadMoreOrders: () => Promise<void>
  orderFilter: StandaloneOrderFilter
  orderFilters: ReadonlyArray<StandaloneOrderFilterOption>
  onOrderFilterChange: (filter: StandaloneOrderFilter) => void
  confirmingCancelOrderId: string | null
  actingOrderId: string | null
  actionErrors: Record<string, string>
  onRequestCancelOrder: (orderId: string) => void
  onDismissCancelOrder: (orderId: string) => void
  onConfirmCancelOrder: (orderId: string) => Promise<void>
  onRetryVerification: (orderId: string) => Promise<void>
  canSendTestVerification: boolean
  canCancelOrders: boolean
  canCreateManualOrder: boolean
  canRetryVerifications: boolean
  isSendingTest: boolean
  testFeedback: TestFeedback | null
  actionFeedback: TestFeedback | null
  onSendTestVerification: (customerPhone: string) => Promise<void>
  onDismissTestFeedback: () => void
  onDismissActionFeedback: () => void
  onManualOrderAccepted: () => void
  error: string | null
}
