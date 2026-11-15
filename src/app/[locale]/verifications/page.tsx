'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardVerificationsStandaloneSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'
import { ImportModalHost } from '@/features/order-imports'
import { SendTestToPhoneAction } from '@/features/onboarding'

function StandaloneVerificationsPageContent() {
  const url = useStandaloneDashboardUrlState()
  return (
    <>
      <DashboardVerificationsStandaloneSkin
        period={url.period}
        periodOptions={url.periodOptions}
        onPeriodChange={url.onPeriodChange}
        tab={url.tab}
        onTabChange={url.onTabChange}
        importBatchId={url.importBatchId}
        openId={url.openId}
        onCloseDetails={url.onCloseDetails}
        phoneTestAction={<SendTestToPhoneAction variant="outline" />}
      />
      {/* "استيراد من ملف" in the top bar opens it through the URL. */}
      <ImportModalHost />
    </>
  )
}

function EmbeddedVerificationsRedirect() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname ?? '')
  const search = useSearchParams().toString()

  useEffect(() => {
    const params = new URLSearchParams(search)
    params.set('tab', 'confirmations')
    router.replace(`/${locale}/dashboard?${params}`)
  }, [locale, router, search])

  return null
}

export default function VerificationsPage() {
  const { mode } = useAkeedMode()

  return (
    <EmbeddedAuthGate
      fallback={<DashboardEmbeddedShellSkeleton variant="confirmations" />}
      onboardingGate="dashboard"
    >
      {mode === 'EMBEDDED' ? (
        <EmbeddedVerificationsRedirect />
      ) : (
        <StandaloneVerificationsPageContent />
      )}
    </EmbeddedAuthGate>
  )
}
