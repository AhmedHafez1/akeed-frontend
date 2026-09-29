'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useStandaloneShell } from '@/shared/layout/StandaloneShellContext'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardStandaloneSkin,
  MainEmbeddedSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'
import { SendTestToPhoneAction } from '@/features/onboarding'

function StandaloneDashboardPageContent() {
  const { period, periodOptions, onPeriodChange, confirmationsHref } =
    useStandaloneDashboardUrlState()
  const { identity } = useStandaloneShell()
  const firstName = identity.fullName?.split(/\s+/)[0] ?? null
  return (
    <DashboardStandaloneSkin
      period={period}
      periodOptions={periodOptions}
      onPeriodChange={onPeriodChange}
      confirmationsHref={confirmationsHref}
      firstName={firstName}
      phoneTestAction={<SendTestToPhoneAction />}
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
