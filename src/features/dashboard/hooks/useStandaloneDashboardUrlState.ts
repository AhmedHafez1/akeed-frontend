'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import {
  legacyStatusToTab,
  rangeParam,
  resolveConfirmationsTab,
  resolveDashboardRange,
} from '../domain/confirmationsUrlState'
import type { DateRangeFilterOption } from '../domain/dashboard.types'
import { DASHBOARD_DATE_RANGE_IDS } from '../domain/verificationFilters'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
} from '../model/dashboard.model'

/**
 * The standalone dashboard and confirmations pages keep their period, tab and
 * import filter in the URL, as the embedded app does, so a reload lands where
 * the merchant was and a link can open the needs-action list directly.
 *
 * `?tab=` wins over an old `?status=` link, which is mapped to the nearest tab.
 */
export function useStandaloneDashboardUrlState() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname)

  const period = resolveDashboardRange(searchParams.get('range'))
  const tabParam = searchParams.get('tab')
  const tab: ConfirmationsTab = tabParam
    ? resolveConfirmationsTab(tabParam)
    : legacyStatusToTab(searchParams.get('status'))
  const importBatchId = searchParams.get('importBatchId') ?? undefined

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      const query = next.toString()
      router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const periodOptions = useMemo<ReadonlyArray<DateRangeFilterOption>>(
    () =>
      DASHBOARD_DATE_RANGE_IDS.map((id) => ({
        id,
        label: t(`filters.dateRange.${id}`),
      })),
    [t]
  )

  /** The confirmations list for a tab, in the period shown here. */
  const confirmationsHref = useCallback(
    (target: ConfirmationsTab) => {
      const params = new URLSearchParams()
      if (target !== 'all') params.set('tab', target)
      const range = rangeParam(period)
      if (range) params.set('range', range)
      const query = params.toString()
      return `${withLocale('/verifications', locale)}${query ? `?${query}` : ''}`
    },
    [locale, period]
  )

  return {
    period,
    periodOptions,
    onPeriodChange: (next: DashboardStatsDateRange) =>
      updateParams({ range: rangeParam(next) }),
    tab,
    onTabChange: (next: ConfirmationsTab) =>
      updateParams({ tab: next === 'all' ? null : next, status: null }),
    importBatchId,
    onClearImportBatch: () => updateParams({ importBatchId: null }),
    confirmationsHref,
  }
}
