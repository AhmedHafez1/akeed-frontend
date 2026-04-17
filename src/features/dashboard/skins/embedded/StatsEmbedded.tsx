import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Card,
  InlineGrid,
  InlineStack,
  ProgressBar,
  Select,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  DashboardStats,
  DashboardStatsDateRange,
} from '../../model/dashboard.model'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type { ColorBorderAlias } from '@shopify/polaris-tokens'

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

interface SummaryMetric {
  id: 'confirmed' | 'canceled' | 'sent' | 'delivered' | 'read'
  label: string
  value: number
  tone: PolarisBadgeTone
  isPrimary?: boolean
}

function resolveMetricBorderColor(tone: PolarisBadgeTone): ColorBorderAlias {
  switch (tone) {
    case 'success':
      return 'border-success'
    case 'critical':
      return 'border-critical'
    case 'warning':
      return 'border-warning'
    case 'info':
      return 'border-info'
    default:
      return 'border-secondary'
  }
}

function resolveRateTone(rate: number): 'critical' | 'success' | 'warning' {
  if (rate >= 80) return 'success'
  if (rate >= 55) return 'warning'
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

  const primaryMetrics: SummaryMetric[] = stats
    ? [
        {
          id: 'confirmed',
          label: t('metrics.cards.confirmed'),
          value: stats.totals.confirmed,
          tone: 'success',
          isPrimary: true,
        },
        {
          id: 'canceled',
          label: t('metrics.cards.canceled'),
          value: stats.totals.canceled,
          tone: 'critical',
          isPrimary: true,
        },
      ]
    : []

  const secondaryMetrics: SummaryMetric[] = stats
    ? [
        {
          id: 'sent',
          label: t('metrics.cards.sent'),
          value: stats.totals.sent,
          tone: 'info',
        },
        {
          id: 'delivered',
          label: t('metrics.cards.delivered'),
          value: stats.totals.delivered,
          tone: 'info',
        },
        {
          id: 'read',
          label: t('metrics.cards.read'),
          value: stats.totals.read,
          tone: 'info',
        },
      ]
    : []

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
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <SkeletonDisplayText size="medium" />
                <SkeletonBodyText lines={1} />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <SkeletonDisplayText size="medium" />
                <SkeletonBodyText lines={1} />
              </BlockStack>
            </Card>
          </InlineGrid>

          <Card>
            <BlockStack gap="300">
              <SkeletonDisplayText size="small" />
              <InlineGrid columns={{ xs: 3 }} gap="300">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBodyText key={i} lines={2} />
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
          {/* Primary KPIs — Confirmed & Canceled (hero emphasis) */}
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            {primaryMetrics.map((metric) => (
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

          {/* Secondary metrics + Reply Rate context */}
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" gap="200">
                <Text variant="headingSm" as="h3">
                  {t('metrics.summaryTitle')}
                </Text>
                <Badge tone={resolveRateTone(stats.totals.reply_rate)}>
                  {t('metrics.replyRate', { value: stats.totals.reply_rate })}
                </Badge>
              </InlineStack>

              <InlineGrid columns={{ xs: 3 }} gap="300">
                {secondaryMetrics.map((metric) => (
                  <Box
                    key={metric.id}
                    padding="300"
                    background="bg-surface-secondary"
                    borderBlockEndWidth="100"
                    borderColor={resolveMetricBorderColor(metric.tone)}
                    borderRadius="200"
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" as="p">
                        {metric.label}
                      </Text>
                      <Text variant="headingXl" as="p">
                        {metric.value}
                      </Text>
                    </BlockStack>
                  </Box>
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>

          {/* Insights row: Savings + Usage */}
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
