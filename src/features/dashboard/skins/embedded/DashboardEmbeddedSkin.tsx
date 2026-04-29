import {
  Banner,
  BlockStack,
  Layout,
  Page,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { EmbeddedVerificationSection } from './components/EmbeddedVerificationSection'
import { StatsEmbedded } from './StatsEmbedded'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardEmbeddedSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  onLoadMoreVerifications,
  hasVerifications,
  emptyVerificationsMessage,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  isSendingTest,
  testFeedback,
  onSendTestVerification,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')

  return (
    <Page title={t('title')} subtitle={t('subtitle')}>
      <BlockStack gap="500">
        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        {testFeedback && (
          <Banner tone={testFeedback.tone} onDismiss={onDismissTestFeedback}>
            <p>{testFeedback.message}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <StatsEmbedded
              stats={stats}
              isStatsLoading={isStatsLoading}
              dateRangeFilter={dateRangeFilter}
              dateRangeOptions={dateRangeOptions}
              onDateRangeFilterChange={onDateRangeFilterChange}
            />
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <EmbeddedVerificationSection
              messages={{
                title: t('verificationSection.title'),
                subtitle: t('verificationSection.subtitle'),
                statusFilterLabel: t('filters.status.label'),
                loadingMore: t('table.loadingMore'),
                loadMore: t('table.loadMore'),
                emptyMessage: emptyVerificationsMessage,
                emptyState: {
                  heading: t('emptyState.onboarding.heading'),
                  activeDescription: t(
                    'emptyState.onboarding.activeDescription'
                  ),
                  step1: t('emptyState.onboarding.step1'),
                  step2: t('emptyState.onboarding.step2'),
                  step3: t('emptyState.onboarding.step3'),
                  testSectionHeading: t(
                    'emptyState.onboarding.testSectionHeading'
                  ),
                  testPhoneLabel: t('emptyState.onboarding.testPhoneLabel'),
                  testPhonePlaceholder: t(
                    'emptyState.onboarding.testPhonePlaceholder'
                  ),
                  testSendLabel: t('emptyState.onboarding.testSendLabel'),
                  testSendingLabel: t(
                    'emptyState.onboarding.testSendingLabel'
                  ),
                  nextStepHint: t('emptyState.onboarding.nextStepHint'),
                },
              }}
              verifications={verifications}
              isVerificationsLoading={isVerificationsLoading}
              hasMoreVerifications={hasMoreVerifications}
              isLoadingMoreVerifications={isLoadingMoreVerifications}
              hasVerifications={hasVerifications}
              statusFilter={statusFilter}
              statusFilters={statusFilters}
              isSendingTest={isSendingTest}
              onStatusFilterChange={onStatusFilterChange}
              onLoadMoreVerifications={onLoadMoreVerifications}
              onSendTestVerification={onSendTestVerification}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  )
}
