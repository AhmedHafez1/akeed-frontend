'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { DashboardPageSkeleton } from '@/shared/layout/skeletons'
import {
  DashboardStandaloneSkin,
  MainEmbeddedSkin,
  useDashboard,
} from '@/features/dashboard'

function StandaloneDashboardPageContent() {
  const skinProps = useDashboard()
  return <DashboardStandaloneSkin {...skinProps} />
}

function DashboardPageContent() {
  const { mode } = useAkeedMode()

  if (mode === 'EMBEDDED') {
    return <MainEmbeddedSkin />
  }

  return <StandaloneDashboardPageContent />
}

export default function DashboardPage() {
  return (
    <EmbeddedAuthGate
      fallback={<DashboardPageSkeleton variant="stats" />}
      onboardingGate="dashboard"
    >
      <DashboardPageContent />
    </EmbeddedAuthGate>
  )
}
