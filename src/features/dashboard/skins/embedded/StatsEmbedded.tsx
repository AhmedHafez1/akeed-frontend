import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Card,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  ProgressBar,
  Select,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
} from '@shopify/polaris'
import {
  SendIcon,
  PackageFulfilledIcon,
  ViewIcon,
  ChatIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type {
  DashboardStats,
  DashboardStatsDateRange,
} from '../../model/dashboard.model'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type { IconSource } from '@shopify/polaris'

interface StatsEmbeddedProps {
  stats: DashboardStats | null
  isStatsLoading: boolean
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
}

type PolarisBadgeTone =
  | 'attention'
  | 'critical'
  | 'info'
  | 'success'
  | 'warning'
  | undefined

interface TopMetric {
  id: 'sent' | 'confirmed' | 'canceled'
  label: string
  value: number
  tone: PolarisBadgeTone
}

interface FunnelStep {
  id: string
  label: string
  value: number
  icon: IconSource
  conversionPercent: string | null
  dropOff: number | null
}

function computeConversion(current: number, previous: number): string {
  if (previous === 0) return '—'
  return `${Math.round((current / previous) * 100)}`
}

function computeDropOff(current: number, previous: number): number {
  return Math.max(0, previous - current)
}

function resolveConversionTone(
  percent: string
): 'critical' | 'success' | 'warning' {
  if (percent === '—') return 'warning'
  const value = parseInt(percent, 10)
  if (value >= 80) return 'success'
  if (value >= 55) return 'warning'
  return 'critical'
}

function resolveUsageProgressTone(
  usagePercent: number
): 'critical' | 'success' {
  if (usagePercent >= 80) return 'critical'
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

export function StatsEmbedded({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
}: StatsEmbeddedProps) {
  const t = useTranslations('dashboard')

  const topMetrics: TopMetric[] = stats
    ? [
        {
          id: 'sent',
          label: t('metrics.cards.sent'),
          value: stats.totals.sent,
          tone: 'info',
        },
        {
          id: 'confirmed',
          label: t('metrics.cards.confirmed'),
          value: stats.totals.confirmed,
          tone: 'success',
        },
        {
          id: 'canceled',
          label: t('metrics.cards.canceled'),
          value: stats.totals.canceled,
          tone: 'critical',
        },
      ]
    : []

  const responded = stats ? stats.totals.confirmed + stats.totals.canceled : 0

  const funnelSteps: FunnelStep[] = stats
    ? [
        {
          id: 'sent',
          label: t('metrics.cards.sent'),
          value: stats.totals.sent,
          icon: SendIcon,
          conversionPercent: null,
          dropOff: null,
        },
        {
          id: 'delivered',
          label: t('metrics.cards.delivered'),
          value: stats.totals.delivered,
          icon: PackageFulfilledIcon,
          conversionPercent: computeConversion(
            stats.totals.delivered,
            stats.totals.sent
          ),
          dropOff: computeDropOff(stats.totals.delivered, stats.totals.sent),
        },
        {
          id: 'read',
          label: t('metrics.cards.read'),
          value: stats.totals.read,
          icon: ViewIcon,
          conversionPercent: computeConversion(
            stats.totals.read,
            stats.totals.delivered
          ),
          dropOff: computeDropOff(stats.totals.read, stats.totals.delivered),
        },
        {
          id: 'responded',
          label: t('metrics.cards.responded'),
          value: responded,
          icon: ChatIcon,
          conversionPercent: computeConversion(responded, stats.totals.read),
          dropOff: computeDropOff(responded, stats.totals.read),
        },
      ]
    : []

  const confirmedPercent = stats
    ? computeConversion(stats.totals.confirmed, responded)
    : '—'
  const canceledPercent = stats
    ? computeConversion(stats.totals.canceled, responded)
    : '—'

  const usagePercent = stats
    ? Math.min(
        100,
        Math.round((stats.usage.used / Math.max(stats.usage.limit, 1)) * 100)
      )
    : 0

  const showUsageWarning = stats && usagePercent >= 80

  return (
    <BlockStack gap="400">
      <InlineStack align="space-between" blockAlign="center" gap="300">
        <BlockStack gap="050">
          <Text variant="headingMd" as="h2">
            {t('metrics.title')}
          </Text>
          <Text variant="bodySm" tone="subdued" as="p">
            {t('metrics.subtitle')}
          </Text>
        </BlockStack>
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
      </InlineStack>

      {isStatsLoading && !stats ? (
        <BlockStack gap="400">
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <BlockStack gap="300">
                  <SkeletonDisplayText size="medium" />
                  <SkeletonBodyText lines={1} />
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>

          <Card>
            <BlockStack gap="300">
              <SkeletonDisplayText size="small" />
              <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBodyText key={i} lines={3} />
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>

          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={2} />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={2} />
              </BlockStack>
            </Card>
          </InlineGrid>
        </BlockStack>
      ) : stats ? (
        <BlockStack gap="400">
          {/* Row 1: Top KPIs — Total (Sent), Confirmed, Canceled */}
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            {topMetrics.map((metric) => (
              <Card key={metric.id}>
                <BlockStack gap="200">
                  <InlineStack
                    align="space-between"
                    blockAlign="center"
                    gap="200"
                  >
                    <Text variant="bodySm" tone="subdued" as="p">
                      {metric.label}
                    </Text>
                    <Badge tone={metric.tone}>{metric.label}</Badge>
                  </InlineStack>
                  <Text variant="heading3xl" as="p">
                    {metric.value}
                  </Text>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>

          {/* Row 2: Verification Funnel */}
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="050">
                <Text variant="headingSm" as="h3">
                  {t('metrics.funnelTitle')}
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  {t('metrics.funnelSubtitle')}
                </Text>
              </BlockStack>

              {/* Funnel steps: horizontal on md+, stacked on xs */}
              <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
                {funnelSteps.map((step) => (
                  <Box
                    key={step.id}
                    padding="300"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={step.icon} tone="subdued" />
                        <Text variant="bodySm" tone="subdued" as="p">
                          {step.label}
                        </Text>
                      </InlineStack>
                      <Text variant="headingXl" as="p">
                        {step.value}
                      </Text>
                      {step.conversionPercent !== null && (
                        <BlockStack gap="100">
                          <Badge
                            tone={resolveConversionTone(step.conversionPercent)}
                          >
                            {t('metrics.conversionFromPrevious', {
                              value: step.conversionPercent,
                            })}
                          </Badge>
                          <Text variant="bodyXs" tone="subdued" as="p">
                            {t('metrics.dropOff', {
                              value: step.dropOff ?? 0,
                            })}
                          </Text>
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Box>
                ))}
              </InlineGrid>

              {/* Response Breakdown: Confirmed vs Canceled split */}
              <Divider />
              <BlockStack gap="200">
                <Text variant="headingSm" as="h4">
                  {t('metrics.responseBreakdown')}
                </Text>
                <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
                  <Box
                    padding="300"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={CheckCircleIcon} tone="success" />
                      <BlockStack gap="100">
                        <Text variant="bodySm" tone="subdued" as="p">
                          {t('metrics.cards.confirmed')}
                        </Text>
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="headingLg" as="p">
                            {stats.totals.confirmed}
                          </Text>
                          <Badge tone="success">
                            {t('metrics.conversionFromPrevious', {
                              value: confirmedPercent,
                            })}
                          </Badge>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>
                  </Box>
                  <Box
                    padding="300"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={XCircleIcon} tone="critical" />
                      <BlockStack gap="100">
                        <Text variant="bodySm" tone="subdued" as="p">
                          {t('metrics.cards.canceled')}
                        </Text>
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="headingLg" as="p">
                            {stats.totals.canceled}
                          </Text>
                          <Badge tone="critical">
                            {t('metrics.conversionFromPrevious', {
                              value: canceledPercent,
                            })}
                          </Badge>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>
                  </Box>
                </InlineGrid>
              </BlockStack>
            </BlockStack>
          </Card>

          {/* Row 3: Insights — Savings + Usage */}
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <BlockStack gap="050">
                  <Text variant="headingSm" as="h3">
                    {t('metrics.moneySaved.title')}
                  </Text>
                  <Text variant="heading2xl" as="p">
                    {formatMoney(
                      stats.savings.money_saved,
                      stats.savings.currency
                    )}
                  </Text>
                </BlockStack>

                <Box
                  borderBlockStartWidth="025"
                  borderColor="border-secondary"
                  paddingBlockStart="300"
                >
                  <BlockStack gap="100">
                    <Text variant="bodyXs" tone="subdued" as="p">
                      {t('metrics.moneySaved.breakdownTitle')}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {t('metrics.moneySaved.breakdownLine', {
                        count: stats.totals.canceled,
                        cost: stats.savings.avg_shipping_cost,
                        currency: stats.savings.currency,
                      })}
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <BlockStack gap="050">
                  <Text variant="headingSm" as="h3">
                    {t('metrics.usage.title')}
                  </Text>
                  <Text variant="heading2xl" as="p">
                    {stats.usage.used} / {stats.usage.limit}
                  </Text>
                </BlockStack>

                <Box
                  borderBlockStartWidth="025"
                  borderColor="border-secondary"
                  paddingBlockStart="300"
                >
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text variant="bodyXs" tone="subdued" as="p">
                        {t('metrics.usage.monthlyLimit')}
                      </Text>
                      <Text
                        variant="bodyXs"
                        tone={resolveUsageProgressTone(usagePercent)}
                        as="p"
                      >
                        {t('metrics.usage.used', { value: usagePercent })}
                      </Text>
                    </InlineStack>
                    <ProgressBar
                      progress={usagePercent}
                      size="small"
                      tone={resolveUsageProgressTone(usagePercent)}
                    />
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </InlineGrid>

          {/* Usage warning banner */}
          {showUsageWarning && (
            <Banner tone={usagePercent >= 95 ? 'critical' : 'warning'}>
              <p>
                {usagePercent >= 95
                  ? t('metrics.usage.warningAtLimit')
                  : t('metrics.usage.warningNearLimit')}
              </p>
            </Banner>
          )}
        </BlockStack>
      ) : (
        <Card>
          <Text variant="bodySm" tone="subdued" as="p">
            {t('metrics.unavailable')}
          </Text>
        </Card>
      )}
    </BlockStack>
  )
}
