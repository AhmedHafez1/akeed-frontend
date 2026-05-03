'use client'

import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { SettingsPageSkeleton } from '@/shared/layout/skeletons'
import {
  MessagePreviewEmbeddedSkin,
  MessagePreviewStandaloneSkin,
} from '@/features/settings'

function MessagePreviewPageContent() {
  const { mode } = useAkeedMode()

  if (mode === 'EMBEDDED') {
    return <MessagePreviewEmbeddedSkin />
  }

  return <MessagePreviewStandaloneSkin />
}

export default function MessagePreviewPage() {
  return (
    <EmbeddedAuthGate
      fallback={<SettingsPageSkeleton />}
      onboardingGate="dashboard"
    >
      <MessagePreviewPageContent />
    </EmbeddedAuthGate>
  )
}
