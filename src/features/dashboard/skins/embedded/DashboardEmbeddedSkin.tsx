import {
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  IndexTable,
  InlineStack,
  Layout,
  Page,
  SkeletonBodyText,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import { StatsEmbedded } from './StatsEmbedded'
import { DashboardEmptyState } from './components/DashboardEmptyState'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

const SKELETON_ROW_COUNT = 5

function VerificationsTableSkeleton() {
  return (
    <IndexTable
      itemCount={SKELETON_ROW_COUNT}
      headings={[
        { id: 'skeleton-order', title: '' },
        { id: 'skeleton-customer', title: '' },
        { id: 'skeleton-status', title: '' },
        { id: 'skeleton-total', title: '' },
        { id: 'skeleton-created', title: '' },
      ]}
      selectable={false}
      hasZebraStriping
    >
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <IndexTable.Row id={`skeleton-${i}`} key={i} position={i}>
          <IndexTable.Cell>
            <SkeletonBodyText lines={2} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={2} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={1} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={1} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={2} />
          </IndexTable.Cell>
        </IndexTable.Row>
      ))}
    </IndexTable>
  )
}

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
    <Page>
      <BlockStack gap="400">
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
                  <VerificationsTableSkeleton />
                ) : hasVerifications ? (
                  <BlockStack gap="300">
                    <VerificationsTableEmbedded verifications={verifications} />
                    {hasMoreVerifications && (
                      <InlineStack align="center">
                        <Button
                          onClick={onLoadMoreVerifications}
                          loading={isLoadingMoreVerifications}
                        >
                          {isLoadingMoreVerifications
                            ? t('table.loadingMore')
                            : t('table.loadMore')}
                        </Button>
                      </InlineStack>
                    )}
                  </BlockStack>
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
                      testPhoneLabel: t('emptyState.onboarding.testPhoneLabel'),
                      testPhonePlaceholder: t(
                        'emptyState.onboarding.testPhonePlaceholder'
                      ),
                      testSendLabel: t('emptyState.onboarding.testSendLabel'),
                      testSendingLabel: t(
                        'emptyState.onboarding.testSendingLabel'
                      ),
                    }}
                    showTestSection={true}
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
