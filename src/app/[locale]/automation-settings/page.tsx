'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getLocaleFromPathname } from '@/shared/lib/locale'

export default function AutomationSettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('tab', 'confirmation-config')
    router.replace(`/${locale}/settings?${nextParams.toString()}`)
  }, [locale, router, searchParams])

  return null
}
