'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { importModalPath, IMPORT_START_PARAM } from '../../domain/importRoutes'

/**
 * `/imports/new` and `/imports/<id>` from before the modal (old links, the
 * billing return trip): the same step, now opened over Verifications.
 */
export function ImportRouteRedirect({ batchId }: { batchId?: string }) {
  const router = useRouter()
  const locale = useLocale() as SupportedLocale

  useEffect(() => {
    const start =
      new URLSearchParams(window.location.search).get(IMPORT_START_PARAM) ===
      '1'
    router.replace(
      withLocale(importModalPath(batchId ?? 'new', { start }), locale)
    )
  }, [batchId, locale, router])

  return null
}
