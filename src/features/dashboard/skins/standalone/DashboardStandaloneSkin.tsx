'use client'

import { useTranslations } from 'next-intl'
import { StandaloneDashboardHeader } from './components/StandaloneDashboardHeader'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneStatsSummary } from './components/StandaloneStatsSummary'
import { StandaloneStatusPanel } from './components/StandaloneStatusPanel'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardStandaloneSkin({
  stats,
  isStatsLoading,
  isAutoVerifyEnabled,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  sourceStatus,
  testFeedback,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')
  const isVerificationActive =
    sourceStatus === 'connected' && isAutoVerifyEnabled

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
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

      {sourceStatus === 'disconnected' && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
        >
          <p className="font-semibold">{t('sourceDisconnectedTitle')}</p>
          <p className="mt-1 text-sm">{t('sourceDisconnectedDescription')}</p>
        </div>
      )}

      <StandaloneStatusPanel
        isActive={isVerificationActive}
        activeLabel={t(
          isVerificationActive
            ? 'statusCard.activeLabel'
            : 'statusCard.inactiveLabel'
        )}
        title={t(
          isVerificationActive ? 'statusCard.title' : 'statusCard.inactiveTitle'
        )}
        description={t(
          isVerificationActive
            ? 'statusCard.description'
            : 'statusCard.inactiveDescription'
        )}
        workflowTitle={t('statusCard.workflowTitle')}
        workflowDescription={t('statusCard.workflowDescription')}
        reviewTitle={t('statusCard.reviewTitle')}
        reviewDescription={t('statusCard.reviewDescription')}
      />

      <StandaloneStatsSummary stats={stats} isStatsLoading={isStatsLoading} />
    </div>
  )
}
