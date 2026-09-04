import { Banner, BlockStack, Layout, Page, Select } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'
import { EmbeddedVerificationSection } from './components/EmbeddedVerificationSection'
import { ConfirmationStatusFlags } from './components/ConfirmationStatusFlags'
import { StatsEmbeddedSkeletonHeader } from './components/StatsEmbeddedSkeletonHeader'

export function DashboardVerificationsEmbeddedSkin({
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  isAutoVerifyEnabled,
  followUpEnabled,
  quietHoursEnabled,
  sourceStatus,
  verifications,
  isVerificationsLoading,
  isStatsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  onLoadMoreVerifications,
  hasVerifications,
  emptyVerificationsMessage,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  isSendingTest,
  canSendTestVerification,
  canCancelOrders,
  testFeedback,
  onSendTestVerification,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')

  return (
    <Page
      title={t('verificationSection.title')}
      subtitle={t('verificationSection.subtitle')}
    >
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

        {sourceStatus === 'disconnected' && (
          <Banner tone="warning" title={t('sourceDisconnectedTitle')}>
            <p>{t('sourceDisconnectedDescription')}</p>
          </Banner>
        )}

        {isStatsLoading ? (
          <StatsEmbeddedSkeletonHeader />
        ) : (
          <div className="flex items-center justify-between">
            <ConfirmationStatusFlags
              autoConfirmStatus={isAutoVerifyEnabled}
              followUpStatus={followUpEnabled}
              quietHoursConfigured={quietHoursEnabled}
            />
            <Select
              label={t('filters.dateRange.label')}
              labelHidden
              options={dateRangeOptions.map((option) => ({
                label: option.label,
                value: option.id,
              }))}
              value={dateRangeFilter}
              onChange={(value) =>
                onDateRangeFilterChange(value as DashboardStatsDateRange)
              }
            />
          </div>
        )}

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
                emptyMessage: emptyVerificationsMessage,
                readOnlyNotice: t('readOnlyNotice'),
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
                  testSendingLabel: t('emptyState.onboarding.testSendingLabel'),
                  nextStepHint: t('emptyState.onboarding.nextStepHint'),
                },
              }}
              verifications={verifications}
              isVerificationsLoading={isVerificationsLoading}
              hasMoreVerifications={hasMoreVerifications}
              isLoadingMoreVerifications={isLoadingMoreVerifications}
              hasVerifications={hasVerifications}
              cancelingVerificationId={cancelingVerificationId}
              confirmingCancelVerificationId={confirmingCancelVerificationId}
              cancelOrderErrors={cancelOrderErrors}
              statusFilter={statusFilter}
              statusFilters={statusFilters}
              isSendingTest={isSendingTest}
              canSendTestVerification={canSendTestVerification}
              canCancelOrders={canCancelOrders}
              onRequestCancelOrder={onRequestCancelOrder}
              onDismissCancelOrder={onDismissCancelOrder}
              onConfirmCancelOrder={onConfirmCancelOrder}
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
