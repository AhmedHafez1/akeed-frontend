import {
  Banner,
  BlockStack,
  Box,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Select,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
} from '@shopify/polaris'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChatIcon,
  PackageFulfilledIcon,
  SendIcon,
  ViewIcon,
} from '@shopify/polaris-icons'
import type { IconSource } from '@shopify/polaris'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type {
  DashboardStats,
  DashboardStatsDateRange,
} from '../../model/dashboard.model'

interface StatsEmbeddedProps {
  stats: DashboardStats | null
  isStatsLoading: boolean
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
}

type PolarisTextTone = 'success' | 'critical' | 'caution' | 'subdued'
type MetricTone = Exclude<PolarisTextTone, 'subdued'>
type PolarisBorderColor =
  | 'border-success'
  | 'border-critical'
  | 'border-caution'

interface TopMetric {
  id: 'confirmed' | 'canceled' | 'awaitingResponse' | 'responseRate'
  label: string
  value: string
  tone: MetricTone
  borderColor: PolarisBorderColor
}

interface FunnelStep {
  id: 'sent' | 'delivered' | 'read' | 'responded'
  label: string
  value: number
  icon: IconSource
}

function resolveResponseRateTone(replyRate: number): MetricTone {
  if (replyRate >= 80) return 'success'
  if (replyRate >= 55) return 'caution'
  return 'critical'
}

function resolveMetricBorderColor(tone: MetricTone): PolarisBorderColor {
  if (tone === 'success') return 'border-success'
  if (tone === 'caution') return 'border-caution'
  return 'border-critical'
}

function formatNumber(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value)
  } catch {
    return String(value)
  }
}

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('dashboard')
  const { isRTL, locale } = useLocaleInfo()

  const awaitingResponse = stats
    ? Math.max(
        0,
        stats.totals.sent - stats.totals.confirmed - stats.totals.canceled
      )
    : 0
  const responseRateTone = stats
    ? resolveResponseRateTone(stats.totals.reply_rate)
    : 'caution'
  const searchQuery = searchParams.toString()
  const settingsHref = `${withLocale('/settings', locale)}${searchQuery ? `?${searchQuery}` : ''}#subscription-usage`

  const topMetrics: TopMetric[] = stats
    ? [
        {
          id: 'confirmed',
          label: t('metrics.cards.confirmed'),
          value: formatNumber(stats.totals.confirmed, locale),
          tone: 'success',
          borderColor: 'border-success',
        },
        {
          id: 'canceled',
          label: t('metrics.cards.canceled'),
          value: formatNumber(stats.totals.canceled, locale),
          tone: 'critical',
          borderColor: 'border-critical',
        },
        {
          id: 'awaitingResponse',
          label: t('metrics.cards.awaitingResponse'),
          value: formatNumber(awaitingResponse, locale),
          tone: 'caution',
          borderColor: 'border-caution',
        },
        {
          id: 'responseRate',
          label: t('metrics.cards.responseRate'),
          value: `${Math.round(stats.totals.reply_rate)}%`,
          tone: responseRateTone,
          borderColor: resolveMetricBorderColor(responseRateTone),
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
        },
        {
          id: 'delivered',
          label: t('metrics.cards.delivered'),
          value: stats.totals.delivered,
          icon: PackageFulfilledIcon,
        },
        {
          id: 'read',
          label: t('metrics.cards.read'),
          value: stats.totals.read,
          icon: ViewIcon,
        },
        {
          id: 'responded',
          label: t('metrics.cards.responded'),
          value: responded,
          icon: ChatIcon,
        },
      ]
    : []

  const usagePercent = stats
    ? Math.min(
        100,
        Math.round((stats.usage.used / Math.max(stats.usage.limit, 1)) * 100)
      )
    : 0

  const showUsageWarning = Boolean(stats) && usagePercent >= 80

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
          <InlineGrid columns={{ xs: 1, md: 4 }} gap="400">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <BlockStack gap="300">
                  <SkeletonDisplayText size="medium" />
                  <SkeletonBodyText lines={1} />
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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

            <Card>
              <BlockStack gap="300">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={2} />
              </BlockStack>
            </Card>
          </div>
        </BlockStack>
      ) : stats ? (
        <BlockStack gap="400">
          <InlineGrid columns={{ xs: 1, md: 4 }} gap="400">
            {topMetrics.map((metric) => (
              <Box
                key={metric.id}
                background="bg-surface"
                borderColor={metric.borderColor}
                borderRadius="300"
                borderWidth="025"
                padding="300"
                shadow="100"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingLg" as="p" tone={metric.tone}>
                    {metric.label}
                  </Text>
                  <Text variant="heading2xl" as="h2">
                    {metric.value}
                  </Text>
                </InlineStack>
              </Box>
            ))}
          </InlineGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="050">
                  <Text variant="headingSm" tone="subdued" as="h3">
                    {t('metrics.funnelTitle')}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {t('metrics.funnelSubtitle')}
                  </Text>
                </BlockStack>

                <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
                  {funnelSteps.map((step) => (
                    <div
                      key={step.id}
                      className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="w-full md:min-w-[85%]">
                        <Box
                          padding="300"
                          background="bg-surface-secondary"
                          borderRadius="200"
                          borderWidth="025"
                          borderColor="border-tertiary"
                        >
                          <InlineStack
                            blockAlign="center"
                            align="space-between"
                          >
                            <Text variant="headingMd" tone="subdued" as="p">
                              {step.label}
                            </Text>
                            <Text variant="heading2xl" as="p">
                              {formatNumber(step.value, locale)}
                            </Text>
                          </InlineStack>
                        </Box>
                      </div>

                      {step.id !== 'responded' && (
                        <>
                          <div className="flex justify-center md:hidden">
                            <Icon source={ArrowDownIcon} tone="subdued" />
                          </div>
                          <div className="hidden md:flex md:items-center">
                            <Icon
                              source={isRTL ? ArrowLeftIcon : ArrowRightIcon}
                              tone="info"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </InlineGrid>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingSm" tone="subdued" as="p">
                    {t('metrics.moneySaved.title')}
                  </Text>
                  <Text variant="headingXl" as="p" tone="success">
                    {formatMoney(
                      stats.savings.money_saved,
                      stats.savings.currency,
                      locale
                    )}
                  </Text>
                </InlineStack>

                <Box
                  background="bg-surface-secondary"
                  borderRadius="200"
                  padding="300"
                >
                  <BlockStack gap="100">
                    <Text variant="bodyXs" tone="subdued" as="p">
                      {t('metrics.moneySaved.breakdownTitle')}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {t('metrics.moneySaved.breakdownLine', {
                        count: formatNumber(stats.totals.canceled, locale),
                        cost: formatMoney(
                          stats.savings.avg_shipping_cost,
                          stats.savings.currency,
                          locale
                        ),
                      })}
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </div>

          {showUsageWarning && (
            <Banner
              tone={usagePercent >= 95 ? 'critical' : 'warning'}
              title={t('metrics.usage.title')}
              action={{
                content: t('metrics.usage.manageCta'),
                onAction: () => router.push(settingsHref),
              }}
            >
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
