'use client'

import { useTranslations } from 'next-intl'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import {
  SettingsEmbeddedPage,
  SettingsEmbeddedSkeleton,
  SettingsStandalonePage,
  SettingsStandaloneSkeleton,
} from '@/features/settings'

function SettingsPageContent() {
  const { mode } = useAkeedMode()
  return mode === 'EMBEDDED' ? (
    <SettingsEmbeddedPage />
  ) : (
    <SettingsStandalonePage />
  )
}

export default function SettingsPage() {
  const { isEmbedded } = useAkeedMode()
  const t = useTranslations('settings.embedded')

  return (
    <EmbeddedAuthGate
      fallback={
        isEmbedded ? (
          <SettingsEmbeddedSkeleton title={t('title')} />
        ) : (
          <SettingsStandaloneSkeleton />
        )
      }
      onboardingGate="dashboard"
    >
      <SettingsPageContent />
    </EmbeddedAuthGate>
  )
}
