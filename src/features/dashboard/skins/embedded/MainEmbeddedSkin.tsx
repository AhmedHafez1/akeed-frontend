'use client'

import { useCallback, useMemo } from 'react'
import { Badge, BlockStack, Page } from '@shopify/polaris'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { resolveMainTab } from '../../domain/mainTabs'
import {
  rangeParam,
  resolveConfirmationsTab,
  resolveDashboardRange,
} from '../../domain/confirmationsUrlState'
import { DASHBOARD_DATE_RANGE_IDS } from '../../domain/verificationFilters'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import { DashboardActivationSection } from './components/DashboardActivationSection'
import { MainTabsTitle } from './components/MainTabsTitle'
import { MetricsPlaceholder } from './components/MetricsPlaceholder'
import { ReviewPromptCard } from './components/ReviewPromptCard'
import { useDashboardActivation } from '../../domain/useDashboardActivation'
import { useReviewPrompt } from '../../domain/useReviewPrompt'
import { OverviewEmbedded } from './OverviewEmbedded'
import { ConfirmationsEmbedded } from './ConfirmationsEmbedded'

/**
 * The embedded app's main page: the dashboard and the confirmations list as
 * two views sharing one period, switched from the page title. Tab, period and the confirmations filter live
 * in the URL, so "كل الطلبات" can link straight to the needs-action list and a
 * reload lands where the merchant was.
 */
export function MainEmbeddedSkin() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = resolveMainTab(searchParams.get('tab'))
  const period = resolveDashboardRange(searchParams.get('range'))
  const confirmationsTab = resolveConfirmationsTab(searchParams.get('filter'))

  const activation = useDashboardActivation()
  const showActivation = activation.isLoaded && activation.isFirstRun
  // Asked only once the store is past setup, never beside the first-run panel
  // and never in the moment before that state is known.
  const showReviewPrompt = activation.isLoaded && !activation.isFirstRun
  // One prompt for both tabs, so it is recorded as shown once per page and
  // its thank-you state survives a tab switch.
  const reviewPrompt = useReviewPrompt(showReviewPrompt)
  const reviewPromptCard = (
    <ReviewPromptCard
      status={reviewPrompt.status}
      results={reviewPrompt.results}
      requesting={reviewPrompt.requesting}
      onRate={reviewPrompt.rate}
      onNotNow={reviewPrompt.notNow}
      onSeeReview={reviewPrompt.seeReview}
    />
  )

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
    updateParams({ range: rangeParam(next) })

  const renderTitle = (needsActionCount: number | null) => (
    <MainTabsTitle
      active={activeTab}
      onSelect={(tab) => updateParams({ tab })}
      needsActionCount={needsActionCount}
    />
  )
  const freeMessagesBadge =
    activation.freeMessagesLeft !== null ? (
      <Badge tone="success">
        {t('activation.freeMessagesLeft', {
          count: activation.freeMessagesLeft,
        })}
      </Badge>
    ) : undefined

  return (
    // Polaris caps a page at 998px, which crowds the nine-column table. Both
    // views share one 1320px width, so switching never moves the page edges.
    <Page fullWidth>
      <div className="mx-auto w-full max-w-330">
        <BlockStack gap="500">
          {showActivation && (
            <DashboardActivationSection activation={activation} />
          )}
          {activeTab === 'metrics' ? (
            showActivation ? (
              <>
                {renderTitle(null)}
                <MetricsPlaceholder
                  title={t('activation.metricsPlaceholder.title')}
                  body={t('activation.metricsPlaceholder.body')}
                />
              </>
            ) : (
              <OverviewEmbedded
                period={period}
                periodOptions={periodOptions}
                onPeriodChange={onPeriodChange}
                renderTitle={renderTitle}
                titleMetadata={freeMessagesBadge}
                afterHeader={reviewPromptCard}
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
              title={renderTitle(null)}
              afterHeader={reviewPromptCard}
              tab={confirmationsTab}
              onEditSettings={activation.openQuietHours}
              onTabChange={(next) =>
                updateParams({ filter: next === 'all' ? null : next })
              }
            />
          )}
        </BlockStack>
      </div>
    </Page>
  )
}
