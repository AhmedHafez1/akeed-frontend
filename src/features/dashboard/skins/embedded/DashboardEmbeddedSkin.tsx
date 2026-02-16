import {
  Badge,
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  EmptyState as PolarisEmptyState,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Select,
  Spinner,
  Text,
} from '@shopify/polaris'
import {
  AlertCircleIcon,
  CalendarTimeIcon,
  CashDollarFilledIcon,
  CheckCircleIcon,
  ChartDonutIcon,
  ClockIcon,
} from '@shopify/polaris-icons'
import type { IconSource } from '@shopify/polaris'
import type { DashboardStatsDateRange } from '@/types/dashboard.model'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import { StatCard, StatTone } from './components/StatCard'

interface KpiMetric {
  id: 'pending' | 'confirmed' | 'canceled' | 'expired'
  label: string
  value: number
  icon: IconSource
  tone: StatTone
}

function resolveRateTone(rate: number): 'critical' | 'success' {
  if (rate >= 80) return 'success'
  if (rate >= 55) return 'critical'
  return 'critical'
}

function resolveUsageProgressTone(
  usagePercent: number
): 'critical' | 'success' {
  if (usagePercent >= 95) return 'critical'
  if (usagePercent >= 80) return 'critical'
  // ProgressBar uses 'highlight' or 'primary' depending on version. 'success' acts as 'highlight' in some contexts or just mapped.
  // Actually ProgressBar tone: 'highlight' | 'primary' | 'success' | 'critical'
  return 'success'
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
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
          icon: ClockIcon,
          tone: 'warning',
        },
        {
          id: 'confirmed',
          label: 'Confirmed',
          value: stats.totals.confirmed,
          icon: CheckCircleIcon,
          tone: 'success',
        },
        {
          id: 'canceled',
          label: 'Cancelled',
          value: stats.totals.canceled,
          icon: AlertCircleIcon,
          tone: 'critical',
        },
        {
          id: 'expired',
          label: 'Expired',
          value: stats.totals.expired,
          icon: CalendarTimeIcon,
          tone: 'base', // Use base to get secondary background
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
      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => {}}>
            <p>{error}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center" gap="300">
                <BlockStack gap="050">
                  <Text variant="headingMd" as="h2">
                    Dashboard Metrics
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Live verification performance overview.
                  </Text>
                </BlockStack>

                <div className="min-w-[220px]">
                  <Select
                    label="Date range"
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
              </InlineStack>

              {isStatsLoading && !stats ? (
                <Card>
                  <InlineStack align="center" gap="200">
                    <Spinner size="small" />
                    <Text variant="bodySm" tone="subdued" as="span">
                      Loading metrics...
                    </Text>
                  </InlineStack>
                </Card>
              ) : stats ? (
                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                  {/* Performance Snapshot */}
                  <StatCard
                    label="Total Verifications"
                    value={stats.totals.total}
                    icon={ChartDonutIcon}
                    tone="info"
                    footer={
                      <BlockStack gap="050">
                        <Text variant="bodyXs" tone="subdued" as="p">
                          Verification Rate
                        </Text>
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="headingMd" as="span">
                            {stats.totals.verification_rate}%
                          </Text>
                          <Badge
                            tone={resolveRateTone(
                              stats.totals.verification_rate
                            )}
                          >
                            {`${stats.totals.confirmed} confirmed`}
                          </Badge>
                        </InlineStack>
                      </BlockStack>
                    }
                  />

                  {/* Money Saved */}
                  <StatCard
                    label="Money Saved"
                    value={formatMoney(
                      stats.savings.money_saved,
                      stats.savings.currency
                    )}
                    icon={CashDollarFilledIcon}
                    tone="success"
                    footer={
                      <BlockStack gap="050">
                        <Text variant="bodyXs" tone="subdued" as="p">
                          Savings Breakdown
                        </Text>
                        <Text variant="bodySm" as="p">
                          {stats.totals.canceled} cancelled ×{' '}
                          {stats.savings.avg_shipping_cost}{' '}
                          {stats.savings.currency} shipping
                        </Text>
                      </BlockStack>
                    }
                  />

                  {/* Usage */}
                  <StatCard
                    label="Included Usage"
                    value={`${stats.usage.used} / ${stats.usage.limit}`}
                    icon={ChartDonutIcon}
                    tone="base"
                    footer={
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text variant="bodyXs" tone="subdued" as="p">
                            Monthly Limit
                          </Text>
                          <Text
                            variant="bodyXs"
                            tone={resolveUsageProgressTone(usagePercent)}
                            as="p"
                          >
                            {usagePercent}% Used
                          </Text>
                        </InlineStack>
                        <ProgressBar
                          progress={usagePercent}
                          size="small"
                          tone={resolveUsageProgressTone(usagePercent)}
                        />
                      </BlockStack>
                    }
                  />

                  {/* KPI Cards */}
                  {kpiMetrics.map((metric) => (
                    <StatCard
                      key={metric.id}
                      label={metric.label}
                      value={metric.value}
                      icon={metric.icon}
                      tone={metric.tone}
                    />
                  ))}
                </InlineGrid>
              ) : (
                <Card>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Metrics are not available right now.
                  </Text>
                </Card>
              )}
            </BlockStack>
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
                        Verification Status
                      </Text>
                      <Badge tone="info">Live</Badge>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Latest verification events across your active channels.
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
