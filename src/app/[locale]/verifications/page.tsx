'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardVerificationsStandaloneSkin,
  useStandaloneDashboardUrlState,
} from '@/features/dashboard'
import { ImportFilterChip, ImportModalHost } from '@/features/order-imports'

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
        headerAction={
          url.importBatchId && (
            <ImportFilterChip
              batchId={url.importBatchId}
              onClear={url.onClearImportBatch}
            />
          )
        }
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

  useEffect(() => {
    router.replace(`/${locale}/dashboard?tab=confirmations`)
  }, [locale, router])

  return null
}

export default function VerificationsPage() {
  const { mode } = useAkeedMode()

  return (
    <EmbeddedAuthGate
      fallback={<DashboardEmbeddedShellSkeleton variant="verifications" />}
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
