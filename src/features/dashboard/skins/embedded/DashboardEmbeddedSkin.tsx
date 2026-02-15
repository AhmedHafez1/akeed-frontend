import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  EmptyState as PolarisEmptyState,
  Icon,
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

interface KpiMetric {
  id: 'pending' | 'confirmed' | 'canceled' | 'expired'
  label: string
  value: number
  icon: IconSource
  badgeTone: 'attention' | 'critical' | 'success' | 'warning'
  iconTone: 'critical' | 'success' | 'warning' | 'info'
  background:
    | 'bg-surface-secondary'
    | 'bg-surface-success'
    | 'bg-surface-warning'
    | 'bg-surface-critical'
}

function resolveRateTone(rate: number): 'attention' | 'critical' | 'success' {
  if (rate >= 80) return 'success'
  if (rate >= 55) return 'attention'
  return 'critical'
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

function MetricIconChip({
  icon,
  tone = 'base',
}: {
  icon: IconSource
  tone?: 'base' | 'critical' | 'success' | 'warning' | 'info'
}) {
  return (
    <Box
      background="bg-surface"
      borderColor="border-secondary"
      borderWidth="025"
      borderRadius="300"
      padding="200"
    >
      <Icon source={icon} tone={tone} />
    </Box>
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
  hasVerifications,
  emptyVerificationsMessage,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  error,
}: DashboardSkinProps) {
  const rangeLabel =
    dateRangeOptions.find((option) => option.id === dateRangeFilter)?.label ??
    'Range'

  const kpiMetrics: KpiMetric[] = stats
    ? [
        {
          id: 'pending',
          label: 'Pending',
          value: stats.totals.pending,
          icon: ClockIcon,
          badgeTone: 'attention',
          iconTone: 'warning',
          background: 'bg-surface-warning',
        },
        {
          id: 'confirmed',
          label: 'Confirmed',
          value: stats.totals.confirmed,
          icon: CheckCircleIcon,
          badgeTone: 'success',
          iconTone: 'success',
          background: 'bg-surface-success',
        },
        {
          id: 'canceled',
          label: 'Cancelled',
          value: stats.totals.canceled,
          icon: AlertCircleIcon,
          badgeTone: 'critical',
          iconTone: 'critical',
          background: 'bg-surface-critical',
        },
        {
          id: 'expired',
          label: 'Expired',
          value: stats.totals.expired,
          icon: CalendarTimeIcon,
          badgeTone: 'warning',
          iconTone: 'warning',
          background: 'bg-surface-secondary',
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
            <Card>
              <BlockStack gap="300">
                <InlineStack
                  align="space-between"
                  blockAlign="center"
                  gap="300"
                >
                  <BlockStack gap="050">
                    <Text variant="headingMd" as="h2">
                      Dashboard Metrics
                    </Text>
                    <Text variant="bodySm" as="p">
                      Live verification performance overview.
                    </Text>
                  </BlockStack>

                  <div style={{ minWidth: 220 }}>
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
                  <BlockStack gap="300">
                    <InlineGrid
                      columns={{ xs: 1, lg: 2 }}
                      gap={{ xs: '200', lg: '300' }}
                    >
                      <Card background="bg-surface-secondary">
                        <Box
                          position="relative"
                          overflowX="hidden"
                          overflowY="hidden"
                        >
                          <Box
                            position="absolute"
                            insetBlockStart="200"
                            insetInlineEnd="200"
                            opacity="0.15"
                          >
                            <Icon source={ChartDonutIcon} tone="subdued" />
                          </Box>

                          <BlockStack gap="200">
                            <InlineStack
                              align="space-between"
                              blockAlign="center"
                            >
                              <InlineStack gap="200" blockAlign="center">
                                <MetricIconChip
                                  icon={ChartDonutIcon}
                                  tone="info"
                                />
                                <Text variant="headingSm" as="h3">
                                  Performance Snapshot
                                </Text>
                              </InlineStack>
                              <Badge tone="info">{rangeLabel}</Badge>
                            </InlineStack>

                            <InlineGrid
                              columns={{ xs: 1, sm: 2 }}
                              gap={{ xs: '150', sm: '300' }}
                            >
                              <BlockStack gap="050">
                                <Text variant="bodyXs" as="p">
                                  Total verifications
                                </Text>
                                <Text variant="heading2xl" as="p">
                                  {stats.totals.total}
                                </Text>
                              </BlockStack>

                              <BlockStack gap="050">
                                <Text variant="bodyXs" as="p">
                                  Verification rate
                                </Text>
                                <InlineStack gap="200" blockAlign="center">
                                  <Text variant="headingLg" as="p">
                                    {`${stats.totals.verification_rate}%`}
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
                            </InlineGrid>
                          </BlockStack>
                        </Box>
                      </Card>

                      <Card background="bg-surface-success">
                        <Box
                          position="relative"
                          overflowX="hidden"
                          overflowY="hidden"
                        >
                          <Box
                            position="absolute"
                            insetBlockStart="200"
                            insetInlineEnd="200"
                            opacity="0.15"
                          >
                            <Icon
                              source={CashDollarFilledIcon}
                              tone="success"
                            />
                          </Box>

                          <BlockStack gap="200">
                            <InlineStack
                              align="space-between"
                              blockAlign="center"
                            >
                              <InlineStack gap="200" blockAlign="center">
                                <MetricIconChip
                                  icon={CashDollarFilledIcon}
                                  tone="success"
                                />
                                <Text variant="headingSm" as="h3">
                                  Money Saved
                                </Text>
                              </InlineStack>
                              <Badge tone="success">
                                {`${stats.totals.canceled} cancelled`}
                              </Badge>
                            </InlineStack>

                            <Text variant="heading2xl" as="p">
                              {formatMoney(
                                stats.savings.money_saved,
                                stats.savings.currency
                              )}
                            </Text>

                            <Text variant="bodySm" as="p">
                              {`${stats.totals.canceled} cancelled x ${stats.savings.avg_shipping_cost} ${stats.savings.currency} avg shipping`}
                            </Text>
                          </BlockStack>
                        </Box>
                      </Card>
                    </InlineGrid>

                    <InlineGrid
                      columns={{ xs: 1, sm: 2, md: 4 }}
                      gap={{ xs: '200', md: '300' }}
                    >
                      {kpiMetrics.map((metric) => {
                        const share =
                          stats.totals.total > 0
                            ? Math.round(
                                (metric.value / stats.totals.total) * 100
                              )
                            : 0

                        return (
                          <Card key={metric.id} background={metric.background}>
                            <Box
                              position="relative"
                              overflowX="hidden"
                              overflowY="hidden"
                            >
                              <Box
                                position="absolute"
                                insetBlockStart="200"
                                insetInlineEnd="200"
                                opacity="0.12"
                              >
                                <Icon
                                  source={metric.icon}
                                  tone={metric.iconTone}
                                />
                              </Box>

                              <BlockStack gap="200">
                                <InlineStack
                                  align="space-between"
                                  blockAlign="center"
                                  gap="200"
                                >
                                  <InlineStack gap="150" blockAlign="center">
                                    <MetricIconChip
                                      icon={metric.icon}
                                      tone={metric.iconTone}
                                    />
                                    <Text
                                      variant="bodySm"
                                      as="p"
                                    >
                                      {metric.label}
                                    </Text>
                                  </InlineStack>
                                  <Badge
                                    tone={metric.badgeTone}
                                  >{`${share}%`}</Badge>
                                </InlineStack>

                                <Text variant="headingLg" as="p">
                                  {metric.value}
                                </Text>
                              </BlockStack>
                            </Box>
                          </Card>
                        )
                      })}
                    </InlineGrid>

                    <Card background="bg-surface-secondary">
                      <Box
                        borderColor="border-secondary"
                        borderWidth="025"
                        borderRadius="300"
                        padding="300"
                      >
                        <BlockStack gap="200">
                          <InlineStack
                            align="space-between"
                            blockAlign="center"
                          >
                            <InlineStack gap="200" blockAlign="center">
                              <MetricIconChip
                                icon={ChartDonutIcon}
                                tone="info"
                              />
                              <Text variant="bodyMd" as="p">
                                Usage this month:{' '}
                                <strong>{stats.usage.used}</strong> /{' '}
                                <strong>{stats.usage.limit}</strong>{' '}
                                verifications
                              </Text>
                            </InlineStack>
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
                      </Box>
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
                    <Text variant="bodySm" as="p">
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
