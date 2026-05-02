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
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  testFeedback,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')

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

      <StandaloneStatusPanel
        activeLabel={t('statusCard.activeLabel')}
        title={t('statusCard.title')}
        description={t('statusCard.description')}
        workflowTitle={t('statusCard.workflowTitle')}
        workflowDescription={t('statusCard.workflowDescription')}
        reviewTitle={t('statusCard.reviewTitle')}
        reviewDescription={t('statusCard.reviewDescription')}
      />

      <StandaloneStatsSummary stats={stats} isStatsLoading={isStatsLoading} />
    </div>
  )
}
