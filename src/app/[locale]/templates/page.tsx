'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import {
  SettingsEmbeddedPage,
  SettingsEmbeddedSkeleton,
  SettingsStandaloneSkeleton,
} from '@/features/settings'

/** Standalone templates now live on the Settings page's Message tab. */
function StandaloneTemplatesRedirect() {
  const router = useRouter()
  const { locale } = useLocaleInfo()

  useEffect(() => {
    router.replace(withLocale('/settings?tab=message', locale))
  }, [locale, router])

  return <SettingsStandaloneSkeleton />
}

function TemplatesPageContent() {
  const { mode } = useAkeedMode()
  // Embedded: the Message tab (the default tab) holds the template settings.
  return mode === 'EMBEDDED' ? (
    <SettingsEmbeddedPage />
  ) : (
    <StandaloneTemplatesRedirect />
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
          <SettingsStandaloneSkeleton />
        )
      }
      onboardingGate="dashboard"
    >
      <TemplatesPageContent />
    </EmbeddedAuthGate>
  )
}
