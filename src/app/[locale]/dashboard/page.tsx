'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardStandaloneSkin,
  MainEmbeddedSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'

function StandaloneDashboardPageContent() {
  const { period, periodOptions, onPeriodChange, confirmationsHref } =
    useStandaloneDashboardUrlState()
  return (
    <DashboardStandaloneSkin
      period={period}
      periodOptions={periodOptions}
      onPeriodChange={onPeriodChange}
      needsActionHref={confirmationsHref('needs_action')}
    />
  )
}

export default function DashboardPage() {
  const { mode } = useAkeedMode()

  return (
    <EmbeddedAuthGate
      fallback={<DashboardEmbeddedShellSkeleton variant="stats" />}
      onboardingGate="dashboard"
    >
      {mode === 'EMBEDDED' ? (
        <MainEmbeddedSkin />
      ) : (
        <StandaloneDashboardPageContent />
      )}
    </EmbeddedAuthGate>
  )
}
