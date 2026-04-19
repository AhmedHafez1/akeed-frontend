import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Card,
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
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
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

type PolarisTextTone = 'success' | 'critical'

interface TopMetric {
  id: 'total' | 'confirmed' | 'canceled'
  label: string
  value: number
  tone?: PolarisTextTone
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
): 'critical' | 'success' | 'caution' {
  if (percent === '—') return 'caution'
  const value = parseInt(percent, 10)
  if (value >= 80) return 'success'
  if (value >= 55) return 'caution'
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
  const { isRTL } = useLocaleInfo()

  const topMetrics: TopMetric[] = stats
    ? [
        {
          id: 'total',
          label: t('metrics.cards.total'),
          value: stats.totals.sent,
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
          conversionPercent: null,
        },
        {
          id: 'read',
          label: t('metrics.cards.read'),
          value: stats.totals.read,
          icon: ViewIcon,
          conversionPercent: null,
        },
        {
          id: 'responded',
          label: t('metrics.cards.responded'),
          value: responded,
          icon: ChatIcon,
          conversionPercent: computeConversion(responded, stats.totals.sent),
          dropOff: computeDropOff(responded, stats.totals.read),
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
              <Card
                key={metric.id}
                background={`bg-surface-${metric.tone ?? 'secondary'}`}
              >
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingLg" as="p" tone={metric.tone}>
                    {metric.label}
                  </Text>
                  <Text variant="heading2xl" as="h2" tone={metric.tone}>
                    {metric.value}
                  </Text>
                </InlineStack>
              </Card>
            ))}
          </InlineGrid>

          {/* Row 2: Verification Funnel */}
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="050">
                  <Text variant="headingSm" as="h3">
                    {t('metrics.funnelTitle')}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {t('metrics.funnelSubtitle')}
                  </Text>
                </BlockStack>

                <Text tone={resolveConversionTone(
                    funnelSteps[3].conversionPercent!
                  )}
                  as='h6'
                  variant='bodyLg'
                >
                  {t('metrics.replyRate', {
                    value: funnelSteps[3].conversionPercent!,
                  })}
                </Text>
              </InlineStack>

              {/* Funnel steps: horizontal on md+, stacked on xs */}
              <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
                {funnelSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="w-full md:min-w-[70%]">
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <InlineStack blockAlign="center" align="space-between">
                          <Text variant="bodyMd" tone="subdued" as="p">
                            {step.label}
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {step.value}
                          </Text>
                        </InlineStack>
                      </Box>
                    </div>

                    {step.id !== 'responded' && (
                      <>
                        <div className="flex justify-center md:hidden">
                          <Icon source={ArrowDownIcon} />
                        </div>
                        <div className="hidden md:flex md:items-center">
                          <Icon
                            source={isRTL ? ArrowLeftIcon : ArrowRightIcon}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </InlineGrid>
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
