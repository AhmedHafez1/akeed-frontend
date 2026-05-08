'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getLocaleFromPathname } from '@/shared/lib/locale'

export default function VerificationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('tab', 'confirmations')
    router.replace(`/${locale}/dashboard?${nextParams.toString()}`)
  }, [locale, router, searchParams])

  return null
}
