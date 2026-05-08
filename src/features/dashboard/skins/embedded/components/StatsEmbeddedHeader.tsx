import { InlineStack, Select } from '@shopify/polaris'
import type { DateRangeFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type { DashboardStatsDateRange } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationStatusFlags } from './ConfirmationStatusFlags'

interface StatsEmbeddedHeaderProps {
  dateRangeLabel: string
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  isAutoVerifyEnabled: boolean
  followUpEnabled: boolean
  quietHoursEnabled: boolean
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
  showDateRangeSelector?: boolean
}

export function StatsEmbeddedHeader({
  dateRangeLabel,
  dateRangeFilter,
  dateRangeOptions,
  isAutoVerifyEnabled,
  followUpEnabled,
  quietHoursEnabled,
  onDateRangeFilterChange,
  showDateRangeSelector = true,
}: StatsEmbeddedHeaderProps) {
  return (
    <InlineStack align="space-between" blockAlign="center" gap="300">
      <ConfirmationStatusFlags
        autoConfirmStatus={isAutoVerifyEnabled}
        followUpStatus={followUpEnabled}
        quietHoursConfigured={quietHoursEnabled}
      />
      {showDateRangeSelector && (
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
      )}
    </InlineStack>
  )
}
