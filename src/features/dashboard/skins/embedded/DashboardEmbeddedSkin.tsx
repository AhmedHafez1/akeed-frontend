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
import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/auth'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import { StatsEmbedded } from './StatsEmbedded'
import { DashboardEmptyState } from './components/DashboardEmptyState'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

interface SendTestVerificationResponse {
  success: boolean
  skipped?: boolean
  reason?: string
}

type TestBannerTone = 'success' | 'critical' | 'warning'

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
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testFeedback, setTestFeedback] = useState<{
    tone: TestBannerTone
    message: string
  } | null>(null)
  const isBillingTestMode =
    process.env.NEXT_PUBLIC_SHOPIFY_BILLING_TEST_MODE === 'true'

  const handleSendTestVerification = useCallback(
    async (customerPhone: string) => {
      const normalizedPhone = customerPhone.trim()
      if (!normalizedPhone) {
        setTestFeedback({
          tone: 'critical',
          message: t('emptyState.onboarding.testPhoneRequired'),
        })
        return
      }

      setIsSendingTest(true)
      setTestFeedback(null)

      try {
        const response = await api.post<SendTestVerificationResponse>(
          '/api/verifications/test',
          {
            customerPhone: normalizedPhone,
          }
        )

        if (response.skipped) {
          setTestFeedback({
            tone: 'warning',
            message: response.reason ?? t('emptyState.onboarding.testSkipped'),
          })
          return
        }

        setTestFeedback({
          tone: 'success',
          message: t('emptyState.onboarding.testSent'),
        })
      } catch (error) {
        console.error('[Dashboard] Failed to send test verification:', error)
        setTestFeedback({
          tone: 'critical',
          message: t('emptyState.onboarding.testFailed'),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [t]
  )

  return (
    <Page title={t('title')} subtitle={t('subtitle')}>
      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => {}}>
            <p>{error}</p>
          </Banner>
        )}

        {testFeedback && (
          <Banner
            tone={testFeedback.tone}
            onDismiss={() => setTestFeedback(null)}
          >
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
                    <Spinner size="small" />
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
                    onSendTestVerification={handleSendTestVerification}
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
