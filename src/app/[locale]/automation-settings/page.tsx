'use client'

import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { SettingsPageSkeleton } from '@/shared/layout/skeletons'
import {
  AutomationSettingsEmbeddedSkin,
  AutomationSettingsStandaloneSkin,
  useSettings,
} from '@/features/settings'

function AutomationSettingsPageContent() {
  const { mode } = useAkeedMode()
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return <SettingsPageSkeleton />
  }

  if (mode === 'EMBEDDED') {
    return <AutomationSettingsEmbeddedSkin {...skinProps} />
  }

  return <AutomationSettingsStandaloneSkin {...skinProps} />
}

export default function AutomationSettingsPage() {
  return (
    <EmbeddedAuthGate
      fallback={<SettingsPageSkeleton />}
      onboardingGate="dashboard"
    >
      <AutomationSettingsPageContent />
    </EmbeddedAuthGate>
  )
}
