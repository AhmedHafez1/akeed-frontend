'use client'

import { useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useStandaloneShell } from '@/shared/layout/StandaloneShellContext'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardStandaloneSkin,
  MainEmbeddedSkin,
  resolveMainTab,
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
  // The loading screen matches the view that opens, so it does not change
  // shape when the session is ready.
  const tab = resolveMainTab(useSearchParams().get('tab'))

  return (
    <EmbeddedAuthGate
      fallback={
        <DashboardEmbeddedShellSkeleton
          variant={tab === 'metrics' ? 'stats' : 'confirmations'}
        />
      }
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
