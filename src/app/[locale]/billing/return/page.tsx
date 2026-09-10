'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BillingReturnPage } from '@/features/billing'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'

function StandaloneBillingReturnRoute() {
  return <BillingReturnPage />
}

export default function BillingReturnRoute() {
  const { isEmbedded, isLoading } = useAkeedMode()
  const { locale } = useLocaleInfo()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isEmbedded)
      router.replace(withLocale('/settings', locale))
  }, [isEmbedded, isLoading, locale, router])

  if (isLoading || isEmbedded) return null
  return <StandaloneBillingReturnRoute />
}
