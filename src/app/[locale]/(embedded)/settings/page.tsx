'use client'

import { useSearchParams } from 'next/navigation'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import {
  SettingsEmbeddedShellSkeleton,
  StandalonePageSkeleton,
} from '@/shared/layout/skeletons'
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
    return mode === 'EMBEDDED' ? (
      <SettingsEmbeddedShellSkeleton variant={skeletonVariant} />
    ) : (
      <StandalonePageSkeleton variant="settings" />
    )
  }

  if (mode === 'EMBEDDED') {
    return <SettingsEmbeddedTabbedSkin {...skinProps} />
  }

  return <SettingsStandaloneSkin {...skinProps} />
}

export default function SettingsPage() {
  const { isEmbedded } = useAkeedMode()
  const searchParams = useSearchParams()
  const skeletonVariant = isEmbedded
    ? resolveSettingsTab(searchParams.get('tab'))
    : 'store'

  return (
    <EmbeddedAuthGate
      fallback={
        isEmbedded ? (
          <SettingsEmbeddedShellSkeleton variant={skeletonVariant} />
        ) : (
          <StandalonePageSkeleton variant="settings" />
        )
      }
      onboardingGate="dashboard"
    >
      <SettingsPageContent skeletonVariant={skeletonVariant} />
    </EmbeddedAuthGate>
  )
}
