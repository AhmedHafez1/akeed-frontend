'use client'

import { useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { DashboardPageSkeleton } from '@/shared/layout/skeletons'
import {
  DashboardStandaloneSkin,
  MainEmbeddedSkin,
  useDashboard,
} from '@/features/dashboard'
import { resolveMainTab } from '@/features/dashboard/domain/mainTabs'

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
  const searchParams = useSearchParams()
  const activeTab = resolveMainTab(searchParams.get('tab'))
  const skeletonVariant =
    activeTab === 'confirmations' ? 'verifications' : 'stats'

  return (
    <EmbeddedAuthGate
      fallback={<DashboardPageSkeleton variant={skeletonVariant} />}
      onboardingGate="dashboard"
    >
      <DashboardPageContent />
    </EmbeddedAuthGate>
  )
}
