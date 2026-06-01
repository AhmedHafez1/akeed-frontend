'use client'

import { useMemo, useState } from 'react'
import { Banner, BlockStack, Layout, Page, Select, Tabs } from '@shopify/polaris'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMainConfirmationsTab } from '../../domain/useMainConfirmationsTab'
import { useMainMetricsTab } from '../../domain/useMainMetricsTab'
import { MAIN_TABS, resolveMainTab } from '../../domain/mainTabs'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import { StatsEmbedded } from './StatsEmbedded'
import { ConfirmationStatusFlags } from './components/ConfirmationStatusFlags'
import { EmbeddedVerificationSection } from './components/EmbeddedVerificationSection'

function MainMetricsTab({
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
}: {
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
}) {
  const metrics = useMainMetricsTab(dateRangeFilter)
  const [isErrorDismissed, setIsErrorDismissed] = useState(false)

  return (
    <BlockStack gap="500">
      {metrics.error && !isErrorDismissed && (
        <Banner tone="critical" onDismiss={() => setIsErrorDismissed(true)}>
          <p>{metrics.error}</p>
        </Banner>
      )}
      <Layout>
        <Layout.Section>
          <StatsEmbedded
            stats={metrics.stats}
            isStatsLoading={metrics.isStatsLoading}
            isAutoVerifyEnabled={metrics.isAutoVerifyEnabled}
            followUpEnabled={metrics.followUpEnabled}
            quietHoursEnabled={metrics.quietHoursEnabled}
            dateRangeFilter={dateRangeFilter}
            dateRangeOptions={dateRangeOptions}
            onDateRangeFilterChange={onDateRangeFilterChange}
            showDateRangeSelector={false}
          />
        </Layout.Section>
      </Layout>
    </BlockStack>
  )
}

function MainConfirmationsTab({
  dateRangeFilter,
}: {
  dateRangeFilter: DashboardStatsDateRange
}) {
  const t = useTranslations('dashboard')
  const confirmations = useMainConfirmationsTab(dateRangeFilter)
  const [isErrorDismissed, setIsErrorDismissed] = useState(false)

  return (
    <BlockStack gap="500">
      {confirmations.error && !isErrorDismissed && (
        <Banner tone="critical" onDismiss={() => setIsErrorDismissed(true)}>
          <p>{confirmations.error}</p>
        </Banner>
      )}
      {confirmations.testFeedback && (
        <Banner
          tone={confirmations.testFeedback.tone}
          onDismiss={confirmations.onDismissTestFeedback}
        >
          <p>{confirmations.testFeedback.message}</p>
        </Banner>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ConfirmationStatusFlags
          autoConfirmStatus={confirmations.isAutoVerifyEnabled}
          followUpStatus={confirmations.followUpEnabled}
          quietHoursConfigured={confirmations.quietHoursEnabled}
        />
      </div>

      <Layout>
        <Layout.Section>
          <EmbeddedVerificationSection
            messages={{
              title: t('verificationSection.title'),
              subtitle: t('verificationSection.subtitle'),
              statusFilterLabel: t('filters.status.label'),
              noReplyTooltip: t('tooltips.noReply'),
              loadingMore: t('table.loadingMore'),
              loadMore: t('table.loadMore'),
              emptyMessage: confirmations.emptyVerificationsMessage,
              emptyState: {
                heading: t('emptyState.onboarding.heading'),
                activeDescription: t('emptyState.onboarding.activeDescription'),
                step1: t('emptyState.onboarding.step1'),
                step2: t('emptyState.onboarding.step2'),
                step3: t('emptyState.onboarding.step3'),
                testSectionHeading: t('emptyState.onboarding.testSectionHeading'),
                testPhoneLabel: t('emptyState.onboarding.testPhoneLabel'),
                testPhonePlaceholder: t(
                  'emptyState.onboarding.testPhonePlaceholder'
                ),
                testSendLabel: t('emptyState.onboarding.testSendLabel'),
                testSendingLabel: t('emptyState.onboarding.testSendingLabel'),
                nextStepHint: t('emptyState.onboarding.nextStepHint'),
              },
            }}
            verifications={confirmations.verifications}
            isVerificationsLoading={confirmations.isVerificationsLoading}
            hasMoreVerifications={confirmations.hasMoreVerifications}
            isLoadingMoreVerifications={
              confirmations.isLoadingMoreVerifications
            }
            hasVerifications={confirmations.hasVerifications}
            cancelingVerificationId={confirmations.cancelingVerificationId}
            confirmingCancelVerificationId={
              confirmations.confirmingCancelVerificationId
            }
            cancelOrderErrors={confirmations.cancelOrderErrors}
            statusFilter={confirmations.statusFilter}
            statusFilters={confirmations.statusFilters}
            isSendingTest={confirmations.isSendingTest}
            onRequestCancelOrder={confirmations.onRequestCancelOrder}
            onDismissCancelOrder={confirmations.onDismissCancelOrder}
            onConfirmCancelOrder={confirmations.onConfirmCancelOrder}
            onStatusFilterChange={confirmations.onStatusFilterChange}
            onLoadMoreVerifications={confirmations.onLoadMoreVerifications}
            onSendTestVerification={confirmations.onSendTestVerification}
          />
        </Layout.Section>
      </Layout>
    </BlockStack>
  )
}

export function MainEmbeddedSkin() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DashboardStatsDateRange>('last_30_days')
  const tabParam = searchParams.get('tab')
  const activeTab = resolveMainTab(tabParam)
  const selected = MAIN_TABS.indexOf(activeTab)

  const tabs = [
    { id: 'metrics', content: t('tabs.metrics') },
    { id: 'confirmations', content: t('tabs.confirmations') },
  ]

  const dateRangeOptions = useMemo<ReadonlyArray<DateRangeFilterOption>>(
    () => [
      { id: 'today', label: t('filters.dateRange.today') },
      { id: 'last_7_days', label: t('filters.dateRange.last_7_days') },
      { id: 'last_30_days', label: t('filters.dateRange.last_30_days') },
      {
        id: 'last_3_months',
        label: t('filters.dateRange.last_3_months'),
      },
    ],
    [t]
  )

  const handleTabSelect = (index: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('tab', MAIN_TABS[index])
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <Page title={t('mainTitle')} subtitle={t('mainSubtitle')}>
      <BlockStack gap="500">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabSelect} />
          </div>
          <Select
            label={t('filters.dateRange.label')}
            labelHidden
            options={dateRangeOptions.map((option) => ({
              label: option.label,
              value: option.id,
            }))}
            value={dateRangeFilter}
            onChange={(value) =>
              setDateRangeFilter(value as DashboardStatsDateRange)
            }
          />
        </div>
        {activeTab === 'metrics' ? (
          <MainMetricsTab
            dateRangeFilter={dateRangeFilter}
            dateRangeOptions={dateRangeOptions}
            onDateRangeFilterChange={setDateRangeFilter}
          />
        ) : (
          <MainConfirmationsTab dateRangeFilter={dateRangeFilter} />
        )}
      </BlockStack>
    </Page>
  )
}
