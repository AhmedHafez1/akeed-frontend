'use client'

import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { OrderImportRowIssue } from '../../api/orderImportsApi'
import { formatImportDate } from '../../domain/format'

/**
 * A row issue as a localized sentence (`orderImport.issues.<CODE>`), with
 * dates formatted for the page locale. Unknown codes read generically rather
 * than showing a raw code.
 */
export function useIssueText() {
  const t = useTranslations('orderImport.issues')
  const locale = useLocale()
  return useCallback(
    (issue: OrderImportRowIssue): string => {
      const params = { ...issue.params }
      if (typeof params.date === 'string')
        params.date = formatImportDate(params.date, locale, false)
      if (typeof params.orderNumber === 'string')
        params.orderNumber = `#${params.orderNumber.replace(/^#/, '')}`
      return t.has(issue.code) ? t(issue.code, params) : t('unknown')
    },
    [t, locale]
  )
}
