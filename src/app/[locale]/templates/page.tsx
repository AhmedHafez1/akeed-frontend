'use client'

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

function TemplatesPageContent() {
  const { mode } = useAkeedMode()
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return mode === 'EMBEDDED' ? (
      <SettingsEmbeddedShellSkeleton variant="message-preview" />
    ) : (
      <StandalonePageSkeleton variant="templates" />
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
          <StandalonePageSkeleton variant="templates" />
        )
      }
      onboardingGate="dashboard"
    >
      <TemplatesPageContent />
    </EmbeddedAuthGate>
  )
}
