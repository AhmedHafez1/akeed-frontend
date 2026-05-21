import { BlockStack, Card, Text } from '@shopify/polaris'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { formatDashboardNumber } from '@/features/dashboard/lib/dashboardFormatters'
import { FunnelCard, type FunnelStep } from './components/FunnelCard'
import { StatsEmbeddedHeader } from './components/StatsEmbeddedHeader'
import { StatsEmbeddedSkeleton } from './components/StatsEmbeddedSkeleton'
import {
  TopMetricGrid,
  type MetricTone,
  type TopMetric,
} from './components/TopMetricGrid'
import { UsageWarningBanner } from './components/UsageWarningBanner'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type {
  DashboardStats,
  DashboardStatsDateRange,
} from '../../model/dashboard.model'
import { StatsEmbeddedSkeletonHeader } from './components/StatsEmbeddedSkeletonHeader'

interface StatsEmbeddedProps {
  stats: DashboardStats | null
  isStatsLoading: boolean
  isAutoVerifyEnabled: boolean
  followUpEnabled: boolean
  quietHoursEnabled: boolean
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
  showDateRangeSelector?: boolean
}

function resolveResponseRateTone(replyRate: number): MetricTone {
  if (replyRate >= 80) return 'success'
  if (replyRate >= 55) return 'caution'
  return 'critical'
}

function resolveConfirmationRateTone(rate: number): MetricTone {
  if (rate >= 70) return 'success'
  if (rate >= 45) return 'caution'
  return 'critical'
}

export function StatsEmbedded({
  stats,
  isStatsLoading,
  isAutoVerifyEnabled,
  followUpEnabled,
  quietHoursEnabled,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  showDateRangeSelector = true,
}: StatsEmbeddedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('dashboard')
  const { isRTL, locale } = useLocaleInfo()

  const responseRateTone = stats
    ? resolveResponseRateTone(stats.totals.reply_rate)
    : 'caution'
  const confirmationRateTone = stats
    ? resolveConfirmationRateTone(stats.totals.confirmation_rate)
    : 'caution'
  const settingsParams = new URLSearchParams(searchParams.toString())
  settingsParams.set('tab', 'billing')
  const settingsQuery = settingsParams.toString()
  const settingsHref = `${withLocale('/settings', locale)}${settingsQuery ? `?${settingsQuery}` : ''}`

  const countMetrics: TopMetric[] = stats
    ? [
        {
          id: 'confirmed',
          label: t('metrics.cards.confirmedOrders'),
          value: formatDashboardNumber(stats.totals.confirmed, locale),
          tone: 'success',
          tooltip: t('tooltips.confirmedOrders'),
        },
        {
          id: 'canceled',
          label: t('metrics.cards.customerCanceled'),
          value: formatDashboardNumber(stats.totals.customer_canceled, locale),
          tone: 'critical',
          tooltip: t('tooltips.customerCanceled'),
        },
        {
          id: 'awaitingResponse',
          label: t('metrics.cards.awaitingResponse'),
          value: formatDashboardNumber(stats.totals.awaiting_reply, locale),
          tone: 'caution',
          tooltip: t('tooltips.awaitingReply'),
        },
        {
          id: 'pending',
          label: t('metrics.cards.pending'),
          value: formatDashboardNumber(stats.totals.pending, locale),
          tone: 'caution',
          tooltip: t('tooltips.pending'),
        },
      ]
    : []

  const rateMetrics: TopMetric[] = stats
    ? [
        {
          id: 'responseRate',
          label: t('metrics.cards.responseRate'),
          value: `${Math.round(stats.totals.reply_rate)}%`,
          tone: responseRateTone,
          tooltip: t('tooltips.responseRate'),
        },
        {
          id: 'confirmationRate',
          label: t('metrics.cards.confirmationRate'),
          value: `${Math.round(stats.totals.confirmation_rate)}%`,
          tone: confirmationRateTone,
          tooltip: t('tooltips.confirmationRate'),
        },
        {
          id: 'failed',
          label: t('metrics.cards.failed'),
          value: formatDashboardNumber(stats.totals.failed, locale),
          tone: 'critical',
          tooltip: t('tooltips.failed'),
        },
        {
          id: 'followUps',
          label: t('metrics.cards.followUps'),
          value: formatDashboardNumber(stats.totals.follow_ups_sent, locale),
          tone: 'caution',
          tooltip: t('tooltips.followUps'),
        },
      ]
    : []

  const funnelSteps: FunnelStep[] = stats
    ? [
        {
          id: 'sent',
          label: t('metrics.cards.sent'),
          value: formatDashboardNumber(stats.totals.sent, locale),
        },
        {
          id: 'delivered',
          label: t('metrics.cards.delivered'),
          value: formatDashboardNumber(stats.totals.delivered, locale),
        },
        {
          id: 'read',
          label: t('metrics.cards.read'),
          value: formatDashboardNumber(stats.totals.read, locale),
        },
        {
          id: 'outcomes',
          label: t('metrics.cards.confirmedCanceled'),
          branches: [
            {
              id: 'confirmed',
              label: t('metrics.cards.confirmed'),
              value: formatDashboardNumber(stats.totals.confirmed, locale),
            },
            {
              id: 'canceled',
              label: t('metrics.cards.canceled'),
              value: formatDashboardNumber(
                stats.totals.customer_canceled,
                locale
              ),
            },
          ],
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
      {isStatsLoading && !stats ? (
        <StatsEmbeddedSkeletonHeader />
      ) : (
        <StatsEmbeddedHeader
          dateRangeLabel={t('filters.dateRange.label')}
          dateRangeFilter={dateRangeFilter}
          dateRangeOptions={dateRangeOptions}
          isAutoVerifyEnabled={isAutoVerifyEnabled}
          followUpEnabled={followUpEnabled}
          quietHoursEnabled={quietHoursEnabled}
          onDateRangeFilterChange={onDateRangeFilterChange}
          showDateRangeSelector={showDateRangeSelector}
        />
      )}

      {isStatsLoading && !stats ? (
        <StatsEmbeddedSkeleton />
      ) : stats ? (
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text variant={isRTL ? 'headingMd' : 'headingSm'} as="h2">
              {t('metrics.sections.orderOutcomes')}
            </Text>
            <TopMetricGrid metrics={countMetrics} isRTL={isRTL} />
          </BlockStack>

          <BlockStack gap="200">
            <Text variant={isRTL ? 'headingMd' : 'headingSm'} as="h2">
              {t('metrics.sections.needsAttention')}
            </Text>
            <TopMetricGrid metrics={rateMetrics} isRTL={isRTL} />
          </BlockStack>

          <FunnelCard
            title={t('metrics.funnelTitle')}
            subtitle={t('metrics.funnelSubtitle')}
            steps={funnelSteps}
            isRTL={isRTL}
          />

          {showUsageWarning && (
            <UsageWarningBanner
              title={t('metrics.usage.title')}
              message={
                usagePercent >= 95
                  ? t('metrics.usage.warningAtLimit')
                  : t('metrics.usage.warningNearLimit')
              }
              manageLabel={t('metrics.usage.manageCta')}
              isAtLimit={usagePercent >= 95}
              onManage={() => router.push(settingsHref)}
            />
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
