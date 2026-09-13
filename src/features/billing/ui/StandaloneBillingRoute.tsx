'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'

/**
 * Credit billing only exists for standalone tenants — a Shopify-embedded store
 * is billed through its subscription plan, and the API rejects its purchases
 * with `BILLING_SOURCE_UNSUPPORTED`. Embedded sessions are sent to Settings,
 * where their plan actually lives.
 */
export function StandaloneBillingRoute({ children }: { children: ReactNode }) {
  const { isEmbedded, isLoading } = useAkeedMode()
  const { locale } = useLocaleInfo()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isEmbedded)
      router.replace(withLocale('/settings', locale))
  }, [isEmbedded, isLoading, locale, router])

  if (isLoading || isEmbedded) return null
  return <>{children}</>
}
