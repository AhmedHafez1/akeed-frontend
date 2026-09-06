'use client'

import { ManualOrderEntryStandalone } from '@/features/orders'
import { StandaloneDashboardHeader } from './components/StandaloneDashboardHeader'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneStatsSummary } from './components/StandaloneStatsSummary'
import { StandaloneStatusPanel } from './components/StandaloneStatusPanel'
import type { StandaloneDashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardStandaloneSkin({
  stats,
  reportingTimezone,
  isStatsLoading,
  isAutoVerifyEnabled,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  sourceStatus,
  testFeedback,
  onDismissTestFeedback,
  error,
  canCreateManualOrder,
  actionFeedback,
  onDismissActionFeedback,
  onManualOrderAccepted,
  orders,
  isOrdersLoading,
  ordersError,
}: StandaloneDashboardSkinProps) {
  const verificationState =
    sourceStatus !== 'connected'
      ? 'disconnected'
      : isAutoVerifyEnabled
        ? 'active'
        : 'paused'

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-8">
      <StandaloneDashboardHeader
        dateRangeFilter={dateRangeFilter}
        dateRangeOptions={dateRangeOptions}
        onDateRangeFilterChange={onDateRangeFilterChange}
        action={
          <ManualOrderEntryStandalone
            canCreate={canCreateManualOrder}
            defaultCurrency={stats?.savings.currency}
            sourceConnected={sourceStatus === 'connected'}
            onAccepted={onManualOrderAccepted}
          />
        }
      />

      <StandaloneFeedbackBanners
        error={error}
        testFeedback={testFeedback}
        onDismissTestFeedback={onDismissTestFeedback}
        actionFeedback={actionFeedback}
        onDismissActionFeedback={onDismissActionFeedback}
      />

      <StandaloneStatusPanel state={verificationState} />

      <StandaloneStatsSummary
        stats={stats}
        reportingTimezone={reportingTimezone}
        isStatsLoading={isStatsLoading}
        orders={orders}
        isOrdersLoading={isOrdersLoading}
        ordersError={ordersError}
      />
    </div>
  )
}
