'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardVerificationsStandaloneSkin,
  useDashboard,
} from '@/features/dashboard'
import { useVerificationStatusQuery } from '@/features/dashboard/hooks/useVerificationStatusQuery'
import { ImportFilterChip, ImportModalHost } from '@/features/order-imports'

function StandaloneVerificationsPageContent() {
  const {
    statusFilter,
    onStatusFilterChange,
    importBatchId,
    onClearImportBatch,
  } = useVerificationStatusQuery()
  const skinProps = useDashboard(
    statusFilter,
    onStatusFilterChange,
    importBatchId
  )
  return (
    <>
      <DashboardVerificationsStandaloneSkin
        {...skinProps}
        headerAction={
          importBatchId && (
            <ImportFilterChip
              batchId={importBatchId}
              onClear={onClearImportBatch}
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
