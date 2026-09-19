'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getLocaleFromPathname } from '@/shared/lib/locale'

/** File import is Standalone only; Shopify embedded mode goes to the dashboard. */
export function EmbeddedImportsRedirect() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    router.replace(`/${locale}/dashboard`)
  }, [locale, router])

  return null
}
