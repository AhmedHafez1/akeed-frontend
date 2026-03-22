import {
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  InlineStack,
  Layout,
  Page,
  Spinner,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import { StatsEmbedded } from './StatsEmbedded'
import { DashboardEmptyState } from './components/DashboardEmptyState'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardEmbeddedSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  verifications,
  isVerificationsLoading,
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
  const isBillingTestMode =
    process.env.NEXT_PUBLIC_SHOPIFY_BILLING_TEST_MODE === 'true'

  return (
    <Page title={t('title')} subtitle={t('subtitle')}>
      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => {}}>
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
            <Card>
              <BlockStack gap="300">
                <InlineStack
                  align="space-between"
                  blockAlign="center"
                  gap="300"
                >
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingMd" as="h2">
                        {t('verificationSection.title')}
                      </Text>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued" as="p">
                      {t('verificationSection.subtitle')}
                    </Text>
                  </BlockStack>

                  <ButtonGroup>
                    {statusFilters.map((filter) => (
                      <Button
                        key={filter.id}
                        pressed={statusFilter === filter.id}
                        onClick={() => onStatusFilterChange(filter.id)}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </InlineStack>

                {isVerificationsLoading ? (
                  <InlineStack align="center" gap="200">
                    <Spinner
                      size="small"
                      accessibilityLabel={t('verificationSection.loading')}
                    />
                    <Text variant="bodySm" tone="subdued" as="span">
                      {t('verificationSection.loading')}
                    </Text>
                  </InlineStack>
                ) : hasVerifications ? (
                  <VerificationsTableEmbedded verifications={verifications} />
                ) : statusFilter === 'all' ? (
                  <DashboardEmptyState
                    messages={{
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
                      testSectionDescription: t(
                        'emptyState.onboarding.testSectionDescription'
                      ),
                      testPhoneLabel: t('emptyState.onboarding.testPhoneLabel'),
                      testPhonePlaceholder: t(
                        'emptyState.onboarding.testPhonePlaceholder'
                      ),
                      testSendLabel: t('emptyState.onboarding.testSendLabel'),
                      testSendingLabel: t(
                        'emptyState.onboarding.testSendingLabel'
                      ),
                    }}
                    showTestSection={isBillingTestMode}
                    isSendingTest={isSendingTest}
                    onSendTestVerification={onSendTestVerification}
                  />
                ) : (
                  <Text as="p" tone="subdued" variant="bodySm">
                    {emptyVerificationsMessage}
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  )
}
