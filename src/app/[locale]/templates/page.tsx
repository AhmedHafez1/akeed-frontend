'use client'

import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { FullPageLoader } from '@/shared/layout/FullPageLoader'
import { SettingsEmbeddedShellSkeleton } from '@/shared/layout/skeletons'
import {
  SettingsEmbeddedTabbedSkin,
  SettingsStandaloneSkin,
  useSettings,
} from '@/features/settings'

function TemplatesPageContent() {
  const { mode } = useAkeedMode()
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return mode === 'EMBEDDED' ? (
      <SettingsEmbeddedShellSkeleton variant="message-preview" />
    ) : (
      <FullPageLoader />
    )
  }

  if (mode === 'EMBEDDED') {
    return <SettingsEmbeddedTabbedSkin {...skinProps} />
  }

  return <SettingsStandaloneSkin {...skinProps} view="templates" />
}

export default function TemplatesPage() {
  const { isEmbedded } = useAkeedMode()

  return (
    <EmbeddedAuthGate
      fallback={
        isEmbedded ? (
          <SettingsEmbeddedShellSkeleton variant="message-preview" />
        ) : (
          <FullPageLoader />
        )
      }
      onboardingGate="dashboard"
    >
      <TemplatesPageContent />
    </EmbeddedAuthGate>
  )
}
