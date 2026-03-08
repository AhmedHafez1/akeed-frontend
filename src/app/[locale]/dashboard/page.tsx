'use client'

import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { FullPageLoader } from '@/shared/layout/FullPageLoader'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import {
  DashboardEmbeddedSkin,
  DashboardStandaloneSkin,
  useDashboard,
} from '@/features/dashboard'

function DashboardPageContent() {
  const { mode } = useAkeedMode()
  const skinProps = useDashboard()

  if (mode === 'EMBEDDED') {
    return <DashboardEmbeddedSkin {...skinProps} />
  }

  return <DashboardStandaloneSkin {...skinProps} />
}

export default function DashboardPage() {
  return (
    <EmbeddedAuthGate fallback={<FullPageLoader />} onboardingGate="dashboard">
      <DashboardPageContent />
    </EmbeddedAuthGate>
  )
}
