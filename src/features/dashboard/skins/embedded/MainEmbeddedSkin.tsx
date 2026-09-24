'use client'

import { useCallback, useMemo } from 'react'
import { Badge, BlockStack, Page, Tabs } from '@shopify/polaris'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MAIN_TABS, resolveMainTab } from '../../domain/mainTabs'
import { DASHBOARD_DATE_RANGE_IDS } from '../../domain/verificationFilters'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
} from '../../model/dashboard.model'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import { DashboardActivationSection } from './components/DashboardActivationSection'
import { MetricsPlaceholder } from './components/MetricsPlaceholder'
import { useDashboardActivation } from '../../domain/useDashboardActivation'
import { OverviewEmbedded } from './OverviewEmbedded'
import {
  CONFIRMATIONS_TABS,
  ConfirmationsEmbedded,
} from './ConfirmationsEmbedded'

const DEFAULT_RANGE: DashboardStatsDateRange = 'last_30_days'

function resolveRange(value: string | null): DashboardStatsDateRange {
  return (DASHBOARD_DATE_RANGE_IDS as readonly string[]).includes(value ?? '')
    ? (value as DashboardStatsDateRange)
    : DEFAULT_RANGE
}

function resolveConfirmationsTab(value: string | null): ConfirmationsTab {
  return (CONFIRMATIONS_TABS as readonly string[]).includes(value ?? '')
    ? (value as ConfirmationsTab)
    : 'all'
}

/**
 * The embedded app's main page: the dashboard and the confirmations list as
 * two tabs sharing one period. Tab, period and the confirmations filter live
 * in the URL, so "كل الطلبات" can link straight to the needs-action list and a
 * reload lands where the merchant was.
 */
export function MainEmbeddedSkin() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = resolveMainTab(searchParams.get('tab'))
  const period = resolveRange(searchParams.get('range'))
  const confirmationsTab = resolveConfirmationsTab(searchParams.get('filter'))

  const activation = useDashboardActivation()
  const showActivation = activation.isLoaded && activation.isFirstRun

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      router.push(`${pathname}?${next.toString()}`)
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

  const onPeriodChange = (next: DashboardStatsDateRange) =>
    updateParams({ range: next === DEFAULT_RANGE ? null : next })

  const tabs = [
    { id: 'metrics', content: t('tabs.metrics') },
    { id: 'confirmations', content: t('tabs.confirmations') },
  ]
  const freeMessagesBadge =
    activation.freeMessagesLeft !== null ? (
      <Badge tone="success">
        {t('activation.freeMessagesLeft', {
          count: activation.freeMessagesLeft,
        })}
      </Badge>
    ) : undefined

  return (
    <Page>
      <BlockStack gap="500">
        {showActivation && (
          <DashboardActivationSection activation={activation} />
        )}
        <Tabs
          tabs={tabs}
          selected={MAIN_TABS.indexOf(activeTab)}
          onSelect={(index) => updateParams({ tab: MAIN_TABS[index] })}
        />
        {activeTab === 'metrics' ? (
          showActivation ? (
            <MetricsPlaceholder
              title={t('activation.metricsPlaceholder.title')}
              body={t('activation.metricsPlaceholder.body')}
            />
          ) : (
            <OverviewEmbedded
              period={period}
              periodOptions={periodOptions}
              onPeriodChange={onPeriodChange}
              titleMetadata={freeMessagesBadge}
              onEditSettings={activation.openQuietHours}
              onViewNeedsAction={() =>
                updateParams({ tab: 'confirmations', filter: 'needs_action' })
              }
            />
          )
        ) : (
          <ConfirmationsEmbedded
            period={period}
            periodOptions={periodOptions}
            onPeriodChange={onPeriodChange}
            tab={confirmationsTab}
            onTabChange={(next) =>
              updateParams({ filter: next === 'all' ? null : next })
            }
          />
        )}
      </BlockStack>
    </Page>
  )
}
