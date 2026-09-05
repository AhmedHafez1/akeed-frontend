'use client'

import { useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardStandaloneSkin,
  DashboardVerificationsStandaloneSkin,
  MainEmbeddedSkin,
  useDashboard,
} from '@/features/dashboard'
import { resolveMainTab } from '@/features/dashboard/domain/mainTabs'

function StandaloneDashboardPageContent({
  showConfirmations,
}: {
  showConfirmations: boolean
}) {
  const skinProps = useDashboard()
  return showConfirmations ? (
    <DashboardVerificationsStandaloneSkin {...skinProps} />
  ) : (
    <DashboardStandaloneSkin {...skinProps} />
  )
}

function DashboardPageContent({
  showStandaloneConfirmations,
}: {
  showStandaloneConfirmations: boolean
}) {
  const { mode } = useAkeedMode()

  if (mode === 'EMBEDDED') {
    return <MainEmbeddedSkin />
  }

  return (
    <StandaloneDashboardPageContent
      showConfirmations={showStandaloneConfirmations}
    />
  )
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const activeTab = resolveMainTab(searchParams.get('tab'))
  const showStandaloneConfirmations =
    searchParams.get('tab') === 'confirmations'
  const skeletonVariant =
    activeTab === 'confirmations' ? 'verifications' : 'stats'

  return (
    <EmbeddedAuthGate
      fallback={<DashboardEmbeddedShellSkeleton variant={skeletonVariant} />}
      onboardingGate="dashboard"
    >
      <DashboardPageContent
        showStandaloneConfirmations={showStandaloneConfirmations}
      />
    </EmbeddedAuthGate>
  )
}
