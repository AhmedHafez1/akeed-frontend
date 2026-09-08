'use client'

import { useEffect } from 'react'

import { ManualOrderEntryStandalone } from '@/features/orders'
import { notify } from '@/shared/ui'
import { StandaloneDashboardHeader } from './components/StandaloneDashboardHeader'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneStatsSummary } from './components/StandaloneStatsSummary'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardStandaloneSkin({
  stats,
  reportingTimezone,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  sourceStatus,
  testFeedback,
  onDismissTestFeedback,
  canCreateManualOrder,
  isAtPlanLimit,
  actionFeedback,
  onDismissActionFeedback,
  verifications,
  isVerificationsLoading,
  error: verificationsError,
}: DashboardSkinProps) {
  useEffect(() => {
    if (!testFeedback || testFeedback.tone === 'critical') return
    const show =
      testFeedback.tone === 'success' ? notify.success : notify.warning
    show({ message: testFeedback.message, id: 'dashboard-test-feedback' })
    onDismissTestFeedback()
  }, [onDismissTestFeedback, testFeedback])

  useEffect(() => {
    if (!actionFeedback) return
    const show =
      actionFeedback.tone === 'success'
        ? notify.success
        : actionFeedback.tone === 'critical'
          ? notify.error
          : notify.warning
    show({ message: actionFeedback.message, id: 'dashboard-action-feedback' })
    onDismissActionFeedback()
  }, [actionFeedback, onDismissActionFeedback])

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-8">
      <StandaloneDashboardHeader
        dateRangeFilter={dateRangeFilter}
        dateRangeOptions={dateRangeOptions}
        onDateRangeFilterChange={onDateRangeFilterChange}
        action={
          <ManualOrderEntryStandalone
            canCreate={canCreateManualOrder}
            sourceConnected={sourceStatus === 'connected'}
            isAtPlanLimit={isAtPlanLimit}
          />
        }
      />

      <StandaloneFeedbackBanners
        error={verificationsError}
        testFeedback={testFeedback?.tone === 'critical' ? testFeedback : null}
        onDismissTestFeedback={onDismissTestFeedback}
        actionFeedback={null}
        onDismissActionFeedback={onDismissActionFeedback}
      />

      <StandaloneStatsSummary
        stats={stats}
        reportingTimezone={reportingTimezone}
        isStatsLoading={isStatsLoading}
        verifications={verifications}
        isVerificationsLoading={isVerificationsLoading}
        verificationsError={verificationsError}
      />
    </div>
  )
}
