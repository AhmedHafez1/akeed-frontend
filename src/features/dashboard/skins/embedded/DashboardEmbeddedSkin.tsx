import {
  Badge,
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Divider,
  EmptyState as PolarisEmptyState,
  Grid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
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
  increaseIsGood: boolean
}

function formatTrendBadge(trend: VerificationStatsTrend): string {
  if (trend.change === 0) {
    return 'No change'
  }

  const sign = trend.change > 0 ? '+' : ''
  if (trend.change_percentage === null) {
    return `${sign}${trend.change}`
  }

  return `${sign}${trend.change} (${sign}${trend.change_percentage}%)`
}

function formatTrendCaption(trend: VerificationStatsTrend): string {
  return `${trend.current_month} this month | ${trend.previous_month} last month`
}

function resolveTrendBadgeTone(
  change: number,
  increaseIsGood: boolean
): 'attention' | 'critical' | 'success' | 'warning' {
  if (change === 0) return 'warning'

  const isPositive = change > 0
  if (increaseIsGood) {
    return isPositive ? 'success' : 'critical'
  }

  return isPositive ? 'critical' : 'success'
}

function resolveUsageBadgeTone(usagePercent: number) {
  if (usagePercent >= 95) return 'critical'
  if (usagePercent >= 80) return 'attention'
  return 'success'
}

function resolveUsageProgressTone(usagePercent: number) {
  if (usagePercent >= 95) return 'critical'
  if (usagePercent >= 80) return 'primary'
  return 'success'
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
          increaseIsGood: false,
        },
        {
          id: 'confirmed',
          label: 'Confirmed',
          value: stats.totals.confirmed,
          trend: stats.monthly_trends.confirmed,
          increaseIsGood: true,
        },
        {
          id: 'canceled',
          label: 'Cancelled',
          value: stats.totals.canceled,
          trend: stats.monthly_trends.canceled,
          increaseIsGood: false,
        },
        {
          id: 'expired',
          label: 'Expired',
          value: stats.totals.expired,
          trend: stats.monthly_trends.expired,
          increaseIsGood: false,
        },
      ]
    : []

  const usagePercent = stats
    ? Math.min(
        100,
        Math.round((stats.usage.used / Math.max(stats.usage.limit, 1)) * 100)
      )
    : 0

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
                <InlineStack align="space-between" blockAlign="center" gap="400">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">
                      Dashboard Metrics
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Performance overview with month-over-month context.
                    </Text>
                  </BlockStack>

                  <div style={{ minWidth: '220px' }}>
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
                    <Grid
                      columns={{ xs: 1, sm: 2 }}
                      gap={{ xs: '300', md: '400' }}
                    >
                      <Grid.Cell>
                        <Card background="bg-surface-secondary">
                          <BlockStack gap="100">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Total verifications (selected range)
                            </Text>
                            <InlineStack align="space-between" blockAlign="center">
                              <Text variant="headingXl" as="p">
                                {stats.totals.total}
                              </Text>
                              <Badge tone="success">
                                {`${stats.totals.verification_rate}% rate`}
                              </Badge>
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      </Grid.Cell>

                      <Grid.Cell>
                        <Card background="bg-surface-secondary">
                          <BlockStack gap="100">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Total trend vs previous month
                            </Text>
                            <InlineStack align="space-between" blockAlign="center">
                              <Text variant="headingMd" as="p">
                                {formatTrendBadge(stats.monthly_trends.total)}
                              </Text>
                              <Badge
                                tone={resolveTrendBadgeTone(
                                  stats.monthly_trends.total.change,
                                  true
                                )}
                              >
                                {`${stats.monthly_trends.total.current_month} now`}
                              </Badge>
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      </Grid.Cell>
                    </Grid>

                    <Divider />

                    <Grid
                      columns={{ xs: 1, sm: 2, md: 4 }}
                      gap={{ xs: '300', md: '400' }}
                    >
                      {kpiMetrics.map((metric) => (
                        <Grid.Cell key={metric.id}>
                          <Card>
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodySm" tone="subdued" as="p">
                                  {metric.label}
                                </Text>
                                <Badge
                                  tone={resolveTrendBadgeTone(
                                    metric.trend.change,
                                    metric.increaseIsGood
                                  )}
                                  size="small"
                                >
                                  {formatTrendBadge(metric.trend)}
                                </Badge>
                              </InlineStack>

                              <Text variant="headingLg" as="p">
                                {metric.value}
                              </Text>

                              <Text variant="bodyXs" tone="subdued" as="p">
                                {formatTrendCaption(metric.trend)}
                              </Text>
                            </BlockStack>
                          </Card>
                        </Grid.Cell>
                      ))}
                    </Grid>

                    <Card background="bg-surface-secondary">
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text variant="bodyMd" as="p">
                            Usage this month: <strong>{stats.usage.used}</strong> /{' '}
                            <strong>{stats.usage.limit}</strong> verifications
                          </Text>
                          <Badge tone={resolveUsageBadgeTone(usagePercent)}>
                            {`${usagePercent}%`}
                          </Badge>
                        </InlineStack>
                        <ProgressBar
                          progress={usagePercent}
                          size="small"
                          tone={resolveUsageProgressTone(usagePercent)}
                        />
                      </BlockStack>
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
