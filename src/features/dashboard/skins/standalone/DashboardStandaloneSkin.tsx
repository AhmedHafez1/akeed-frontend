'use client'

import { useEffect, useState } from 'react'

import { notify } from '@/shared/ui'
import { CreditsBadge } from '@/features/billing/ui/components/CreditsBadge'
import { StandaloneDashboardHeader } from './components/StandaloneDashboardHeader'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneStatsSummary } from './components/StandaloneStatsSummary'
import { WelcomeCreditsModal } from './components/WelcomeCreditsModal'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardStandaloneSkin({
  stats,
  reportingTimezone,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  testFeedback,
  onDismissTestFeedback,
  actionFeedback,
  onDismissActionFeedback,
  verifications,
  isVerificationsLoading,
  error: verificationsError,
  creditDenialCode,
}: DashboardSkinProps) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Deliberately deferred to an effect (rather than a lazy useState
  // initializer) so the first client render matches the server-rendered
  // markup and hydration never sees a dialog that's already open.
  useEffect(() => {
    try {
      const justCompleted = window.sessionStorage.getItem(
        'akeed:onboarding-just-completed'
      )
      if (justCompleted) {
        window.sessionStorage.removeItem('akeed:onboarding-just-completed')
        // One-shot consumption of a flag set just before the redirect into
        // this page; there's no prop/state to derive this from during render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowWelcomeModal(true)
      }
    } catch {
      // Storage unavailable — modal just doesn't show.
    }
  }, [])

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
    <div className="mx-auto w-full max-w-350 space-y-6 pb-8">
      <StandaloneDashboardHeader
        dateRangeFilter={dateRangeFilter}
        dateRangeOptions={dateRangeOptions}
        onDateRangeFilterChange={onDateRangeFilterChange}
        action={<CreditsBadge />}
      />

      <StandaloneFeedbackBanners
        error={verificationsError}
        testFeedback={testFeedback?.tone === 'critical' ? testFeedback : null}
        onDismissTestFeedback={onDismissTestFeedback}
        actionFeedback={null}
        onDismissActionFeedback={onDismissActionFeedback}
        creditDenialCode={creditDenialCode}
      />

      <StandaloneStatsSummary
        stats={stats}
        reportingTimezone={reportingTimezone}
        isStatsLoading={isStatsLoading}
        verifications={verifications}
        isVerificationsLoading={isVerificationsLoading}
        verificationsError={verificationsError}
      />

      <WelcomeCreditsModal
        open={showWelcomeModal}
        onOpenChange={setShowWelcomeModal}
      />
    </div>
  )
}
