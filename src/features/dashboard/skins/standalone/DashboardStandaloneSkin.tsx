'use client'

import { StandaloneDashboardHeader } from './components/StandaloneDashboardHeader'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneStatsSummary } from './components/StandaloneStatsSummary'
import { StandaloneVerificationsSection } from './components/StandaloneVerificationsSection'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardStandaloneSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  onLoadMoreVerifications,
  hasVerifications,
  emptyVerificationsMessage,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  isSendingTest,
  testFeedback,
  onSendTestVerification,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  return (
    <div className="space-y-8">
      <StandaloneDashboardHeader
        dateRangeFilter={dateRangeFilter}
        dateRangeOptions={dateRangeOptions}
        onDateRangeFilterChange={onDateRangeFilterChange}
      />

      <StandaloneFeedbackBanners
        error={error}
        testFeedback={testFeedback}
        onDismissTestFeedback={onDismissTestFeedback}
      />

      <StandaloneStatsSummary stats={stats} isStatsLoading={isStatsLoading} />

      <StandaloneVerificationsSection
        verifications={verifications}
        isVerificationsLoading={isVerificationsLoading}
        hasMoreVerifications={hasMoreVerifications}
        isLoadingMoreVerifications={isLoadingMoreVerifications}
        hasVerifications={hasVerifications}
        emptyVerificationsMessage={emptyVerificationsMessage}
        cancelingVerificationId={cancelingVerificationId}
        confirmingCancelVerificationId={confirmingCancelVerificationId}
        cancelOrderErrors={cancelOrderErrors}
        statusFilter={statusFilter}
        statusFilters={statusFilters}
        isSendingTest={isSendingTest}
        onRequestCancelOrder={onRequestCancelOrder}
        onDismissCancelOrder={onDismissCancelOrder}
        onConfirmCancelOrder={onConfirmCancelOrder}
        onStatusFilterChange={onStatusFilterChange}
        onLoadMoreVerifications={onLoadMoreVerifications}
        onSendTestVerification={onSendTestVerification}
      />
    </div>
  )
}
