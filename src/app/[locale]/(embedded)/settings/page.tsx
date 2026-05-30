'use client'

import { useSearchParams } from 'next/navigation'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { SettingsPageSkeleton } from '@/shared/layout/skeletons'
import {
  SettingsEmbeddedTabbedSkin,
  SettingsStandaloneSkin,
  useSettings,
} from '@/features/settings'
import { resolveSettingsTab } from '@/features/settings/domain/settingsTabs'

function SettingsPageContent({
  skeletonVariant,
}: {
  skeletonVariant: 'store' | 'confirmation' | 'message-preview' | 'billing'
}) {
  const { mode } = useAkeedMode()
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return <SettingsPageSkeleton variant={skeletonVariant} />
  }

  if (mode === 'EMBEDDED') {
    return <SettingsEmbeddedTabbedSkin {...skinProps} />
  }

  return <SettingsStandaloneSkin {...skinProps} />
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const skeletonVariant = resolveSettingsTab(searchParams.get('tab'))

  return (
    <EmbeddedAuthGate
      fallback={<SettingsPageSkeleton variant={skeletonVariant} />}
      onboardingGate="dashboard"
    >
      <SettingsPageContent skeletonVariant={skeletonVariant} />
    </EmbeddedAuthGate>
  )
}
