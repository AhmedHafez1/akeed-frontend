'use client'

import { useTranslations } from 'next-intl'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { StandalonePageSkeleton } from '@/shared/layout/skeletons'
import {
  SettingsEmbeddedPage,
  SettingsEmbeddedSkeleton,
  SettingsStandaloneSkin,
  useSettings,
} from '@/features/settings'

function StandaloneSettingsContent() {
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return <StandalonePageSkeleton variant="settings" />
  }

  return <SettingsStandaloneSkin {...skinProps} />
}

function SettingsPageContent() {
  const { mode } = useAkeedMode()
  return mode === 'EMBEDDED' ? (
    <SettingsEmbeddedPage />
  ) : (
    <StandaloneSettingsContent />
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
          <StandalonePageSkeleton variant="settings" />
        )
      }
      onboardingGate="dashboard"
    >
      <SettingsPageContent />
    </EmbeddedAuthGate>
  )
}
