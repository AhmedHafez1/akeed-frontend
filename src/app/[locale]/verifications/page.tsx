'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { DashboardPageSkeleton } from '@/shared/layout/skeletons'
import {
  DashboardVerificationsEmbeddedSkin,
  DashboardVerificationsStandaloneSkin,
  useDashboard,
} from '@/features/dashboard'

function VerificationsPageContent() {
  const { mode } = useAkeedMode()
  const skinProps = useDashboard()

  if (mode === 'EMBEDDED') {
    return <DashboardVerificationsEmbeddedSkin {...skinProps} />
  }

  return <DashboardVerificationsStandaloneSkin {...skinProps} />
}

export default function VerificationsPage() {
  return (
    <EmbeddedAuthGate
      fallback={<DashboardPageSkeleton variant="verifications" />}
      onboardingGate="dashboard"
    >
      <VerificationsPageContent />
    </EmbeddedAuthGate>
  )
}
