import {
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  EmptyState as PolarisEmptyState,
  Grid,
  InlineStack,
  Layout,
  Page,
  Select,
  Spinner,
  Text,
} from '@shopify/polaris'
import type {
  DashboardStatsDateRange,
  VerificationStatsTrend,
} from '@/types/dashboard.model'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

interface KpiMetric {
  id: 'pending' | 'confirmed' | 'canceled' | 'expired'
  label: string
  value: number
  trend: VerificationStatsTrend
  background:
    | 'bg-surface-warning'
    | 'bg-surface-success'
    | 'bg-surface-critical'
    | 'bg-surface-caution'
  increaseIsGood: boolean
}

function formatTrendLabel(trend: VerificationStatsTrend): string {
  const sign = trend.change > 0 ? '+' : ''
  const percentage =
    trend.change_percentage === null
      ? 'no prior month baseline'
      : `${sign}${trend.change_percentage}%`

  return `${sign}${trend.change} vs last month (${percentage})`
}

function resolveTrendTone(change: number, increaseIsGood: boolean) {
  if (change === 0) return 'subdued'

  const isPositive = change > 0
  if (increaseIsGood) {
    return isPositive ? 'success' : 'critical'
  }

  return isPositive ? 'critical' : 'success'
}

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
  const kpiMetrics: KpiMetric[] = stats
    ? [
        {
          id: 'pending',
          label: 'Pending',
          value: stats.totals.pending,
          trend: stats.monthly_trends.pending,
          background: 'bg-surface-warning',
          increaseIsGood: false,
        },
        {
          id: 'confirmed',
          label: 'Confirmed',
          value: stats.totals.confirmed,
          trend: stats.monthly_trends.confirmed,
          background: 'bg-surface-success',
          increaseIsGood: true,
        },
        {
          id: 'canceled',
          label: 'Cancelled',
          value: stats.totals.canceled,
          trend: stats.monthly_trends.canceled,
          background: 'bg-surface-critical',
          increaseIsGood: false,
        },
        {
          id: 'expired',
          label: 'Expired',
          value: stats.totals.expired,
          trend: stats.monthly_trends.expired,
          background: 'bg-surface-caution',
          increaseIsGood: false,
        },
      ]
    : []

  return (
    <Page
      title="Dashboard"
      subtitle="Monitor verification status and recent orders across your channels."
    >
      <BlockStack gap="500">
        {error && (
          <Banner tone="critical" onDismiss={() => {}}>
            <p>{error}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">
                      Dashboard Metrics
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Live KPI overview with month-over-month trends.
                    </Text>
                  </BlockStack>

                  <div className="min-w-220px">
                    <Select
                      label="Date range"
                      labelHidden
                      options={dateRangeOptions.map((option) => ({
                        label: option.label,
                        value: option.id,
                      }))}
                      value={dateRangeFilter}
                      onChange={(value) =>
                        onDateRangeFilterChange(
                          value as DashboardStatsDateRange
                        )
                      }
                    />
                  </div>
                </InlineStack>

                {isStatsLoading && !stats ? (
                  <InlineStack align="center" gap="200">
                    <Spinner size="small" />
                    <Text variant="bodySm" tone="subdued" as="span">
                      Loading metrics...
                    </Text>
                  </InlineStack>
                ) : stats ? (
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" as="p">
                        Total in selected range:{' '}
                        <strong>{stats.totals.total}</strong>
                      </Text>
                      <Text variant="bodyMd" as="p">
                        Verification rate:{' '}
                        <strong>{stats.totals.verification_rate}%</strong>
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Monthly trend:{' '}
                        {formatTrendLabel(stats.monthly_trends.total)}
                      </Text>
                    </InlineStack>

                    <Grid
                      columns={{ xs: 1, sm: 2, md: 4 }}
                      gap={{ xs: '300', md: '400' }}
                    >
                      {kpiMetrics.map((metric) => (
                        <Grid.Cell key={metric.id}>
                          <Card background={metric.background}>
                            <BlockStack gap="100">
                              <Text variant="bodySm" tone="subdued" as="p">
                                {metric.label}
                              </Text>
                              <Text variant="heading2xl" as="p">
                                {metric.value}
                              </Text>
                              <Text
                                variant="bodySm"
                                tone={resolveTrendTone(
                                  metric.trend.change,
                                  metric.increaseIsGood
                                )}
                                as="p"
                              >
                                {formatTrendLabel(metric.trend)}
                              </Text>
                            </BlockStack>
                          </Card>
                        </Grid.Cell>
                      ))}
                    </Grid>

                    <Card background="bg-surface-secondary">
                      <Text variant="bodyMd" as="p">
                        Usage this month: <strong>{stats.usage.used}</strong> /{' '}
                        <strong>{stats.usage.limit}</strong> verifications.
                      </Text>
                    </Card>
                  </BlockStack>
                ) : (
                  <Text variant="bodySm" tone="subdued" as="p">
                    Metrics are not available right now.
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">
                      Verification Status
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Track pending, sent, confirmed, and canceled verification
                      flows.
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
                      Loading verifications...
                    </Text>
                  </InlineStack>
                ) : hasVerifications ? (
                  <VerificationsTableEmbedded verifications={verifications} />
                ) : (
                  <PolarisEmptyState
                    heading="No verifications"
                    image={null as unknown as string}
                  >
                    <p>{emptyVerificationsMessage}</p>
                  </PolarisEmptyState>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  )
}
