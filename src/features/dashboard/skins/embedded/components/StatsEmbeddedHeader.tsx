import { BlockStack, InlineStack, Select, Text } from '@shopify/polaris'
import type { DateRangeFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type { DashboardStatsDateRange } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationStatusFlags } from './ConfirmationStatusFlags'

interface StatsEmbeddedHeaderProps {
  title: string
  subtitle: string
  dateRangeLabel: string
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  isRTL: boolean
  isAutoVerifyEnabled: boolean
  followUpEnabled: boolean
  quietHoursEnabled: boolean
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
}

export function StatsEmbeddedHeader({
  title,
  dateRangeLabel,
  dateRangeFilter,
  dateRangeOptions,
  isAutoVerifyEnabled,
  followUpEnabled,
  quietHoursEnabled,
  onDateRangeFilterChange,
}: StatsEmbeddedHeaderProps) {
  return (
    <InlineStack align="space-between" blockAlign="center" gap="300">
      <ConfirmationStatusFlags
        autoConfirmStatus={isAutoVerifyEnabled}
        followUpStatus={followUpEnabled}
        quietHoursConfigured={quietHoursEnabled}
      />
      <Select
        label={dateRangeLabel}
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
  )
}
