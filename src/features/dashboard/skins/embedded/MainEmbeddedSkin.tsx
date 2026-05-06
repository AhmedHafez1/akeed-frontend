'use client'

import { Banner, BlockStack, Layout, Page, Select, Tabs } from '@shopify/polaris'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMainConfirmationsTab } from '../../domain/useMainConfirmationsTab'
import { useMainMetricsTab } from '../../domain/useMainMetricsTab'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'
import { StatsEmbedded } from './StatsEmbedded'
import { ConfirmationStatusFlags } from './components/ConfirmationStatusFlags'
import { EmbeddedVerificationSection } from './components/EmbeddedVerificationSection'

type MainTabId = 'metrics' | 'confirmations'

const MAIN_TABS: MainTabId[] = ['metrics', 'confirmations']

function MainMetricsTab() {
  const metrics = useMainMetricsTab()

  return (
    <BlockStack gap="500">
      {metrics.error && (
        <Banner tone="critical">
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
            dateRangeFilter={metrics.dateRangeFilter}
            dateRangeOptions={metrics.dateRangeOptions}
            onDateRangeFilterChange={metrics.onDateRangeFilterChange}
          />
        </Layout.Section>
      </Layout>
    </BlockStack>
  )
}

function MainConfirmationsTab() {
  const t = useTranslations('dashboard')
  const confirmations = useMainConfirmationsTab()

  return (
    <BlockStack gap="500">
      {confirmations.error && (
        <Banner tone="critical">
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
        <Select
          label={t('filters.dateRange.label')}
          labelHidden
          options={confirmations.dateRangeOptions.map((option) => ({
            label: option.label,
            value: option.id,
          }))}
          value={confirmations.dateRangeFilter}
          onChange={(value) =>
            confirmations.onDateRangeFilterChange(
              value as DashboardStatsDateRange
            )
          }
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
  const tabParam = searchParams.get('tab')
  const activeTab: MainTabId = MAIN_TABS.includes(tabParam as MainTabId)
    ? (tabParam as MainTabId)
    : 'metrics'
  const selected = MAIN_TABS.indexOf(activeTab)

  const tabs = [
    { id: 'metrics', content: t('tabs.metrics') },
    { id: 'confirmations', content: t('tabs.confirmations') },
  ]

  const handleTabSelect = (index: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('tab', MAIN_TABS[index])
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <Page title={t('mainTitle')} subtitle={t('mainSubtitle')}>
      <BlockStack gap="500">
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabSelect} />
        {activeTab === 'metrics' ? <MainMetricsTab /> : <MainConfirmationsTab />}
      </BlockStack>
    </Page>
  )
}
