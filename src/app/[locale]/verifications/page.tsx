'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { getLocaleFromPathname } from '@/shared/lib/locale'
import {
  DashboardEmbeddedShellSkeleton,
  DashboardVerificationsStandaloneSkin,
  useDashboard,
  VERIFICATION_STATUS_FILTER_IDS,
} from '@/features/dashboard'
import type { VerificationStatusFilter } from '@/features/dashboard'

function isStatusFilter(
  value: string | null
): value is VerificationStatusFilter {
  return (
    value !== null &&
    (VERIFICATION_STATUS_FILTER_IDS as readonly string[]).includes(value)
  )
}

function StandaloneVerificationsPageContent() {
  const searchParams = useSearchParams()
  const requested = searchParams.get('status')
  const skinProps = useDashboard(isStatusFilter(requested) ? requested : 'all')
  return <DashboardVerificationsStandaloneSkin {...skinProps} />
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
