'use client'

import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { SettingsPageSkeleton } from '@/shared/layout/skeletons'
import {
  SettingsEmbeddedTabbedSkin,
  SettingsStandaloneSkin,
  useSettings,
} from '@/features/settings'

function SettingsPageContent() {
  const { mode } = useAkeedMode()
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return <SettingsPageSkeleton />
  }

  if (mode === 'EMBEDDED') {
    return <SettingsEmbeddedTabbedSkin {...skinProps} />
  }

  return <SettingsStandaloneSkin {...skinProps} />
}

export default function SettingsPage() {
  return (
    <EmbeddedAuthGate
      fallback={<SettingsPageSkeleton />}
      onboardingGate="dashboard"
    >
      <SettingsPageContent />
    </EmbeddedAuthGate>
  )
}
