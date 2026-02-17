import {
  Badge,
  BlockStack,
  Box,
  Card,
  InlineGrid,
  InlineStack,
  ProgressBar,
  Select,
  Spinner,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  DashboardStats,
  DashboardStatsDateRange,
} from '@/types/dashboard.model'
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
  | 'brand'
  | 'critical'
  | 'info'
  | 'success'
  | 'warning'
  | undefined

interface SummaryMetric {
  id: 'total' | 'confirmed' | 'canceled' | 'pending' | 'expired'
  label: string
  value: number
  tone: PolarisBadgeTone
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
    case 'brand':
      return 'border-brand'
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
  if (usagePercent >= 95) return 'critical'
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

  const summaryMetrics: SummaryMetric[] = stats
    ? [
        {
          id: 'total',
          label: t('metrics.cards.total'),
          value: stats.totals.total,
          tone: 'brand',
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
        {
          id: 'pending',
          label: t('metrics.cards.pending'),
          value: stats.totals.pending,
          tone: 'brand',
        },
        {
          id: 'expired',
          label: t('metrics.cards.expired'),
          value: stats.totals.expired,
          tone: 'warning',
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
        <Card>
          <InlineStack align="center" gap="200">
            <Spinner size="small" />
            <Text variant="bodySm" tone="subdued" as="span">
              {t('metrics.loading')}
            </Text>
          </InlineStack>
        </Card>
      ) : stats ? (
        <BlockStack gap="400">
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

              <InlineGrid columns={{ xs: 2, sm: 3, md: 5 }} gap="300">
                {summaryMetrics.map((metric) => (
                  <Box
                    key={metric.id}
                    padding="200"
                    background="bg-surface-secondary"
                    borderBlockEndWidth="100"
                    borderColor={resolveMetricBorderColor(metric.tone)}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" as="p">
                        {metric.label}
                      </Text>
                      <Text alignment="center" variant="heading3xl" as="p">
                        {metric.value}
                      </Text>
                    </BlockStack>
                  </Box>
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>

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
                  <BlockStack gap="050">
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
