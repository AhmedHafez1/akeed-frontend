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

function StandaloneTemplatesContent() {
  const { isPageLoading, skinProps } = useSettings()

  if (isPageLoading) {
    return <StandalonePageSkeleton variant="templates" />
  }

  return <SettingsStandaloneSkin {...skinProps} view="templates" />
}

function TemplatesPageContent() {
  const { mode } = useAkeedMode()
  // Embedded: the Message tab (the default tab) holds the template settings.
  return mode === 'EMBEDDED' ? (
    <SettingsEmbeddedPage />
  ) : (
    <StandaloneTemplatesContent />
  )
}

export default function TemplatesPage() {
  const { isEmbedded } = useAkeedMode()
  const t = useTranslations('settings.embedded')

  return (
    <EmbeddedAuthGate
      fallback={
        isEmbedded ? (
          <SettingsEmbeddedSkeleton title={t('title')} />
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
