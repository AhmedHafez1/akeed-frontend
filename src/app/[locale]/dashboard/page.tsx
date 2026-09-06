'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardStandaloneSkin,
  MainEmbeddedSkin,
  useDashboard,
} from '@/features/dashboard'

function StandaloneDashboardPageContent() {
  const skinProps = useDashboard()
  return <DashboardStandaloneSkin {...skinProps} />
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
