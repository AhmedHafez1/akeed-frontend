import { BlockStack, InlineStack, Select, Text } from '@shopify/polaris'
import type { DateRangeFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type { DashboardStatsDateRange } from '@/features/dashboard/model/dashboard.model'

interface StatsEmbeddedHeaderProps {
  title: string
  subtitle: string
  dateRangeLabel: string
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  isRTL: boolean
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
}

export function StatsEmbeddedHeader({
  title,
  subtitle,
  dateRangeLabel,
  dateRangeFilter,
  dateRangeOptions,
  isRTL,
  onDateRangeFilterChange,
}: StatsEmbeddedHeaderProps) {
  return (
    <InlineStack align="space-between" blockAlign="center" gap="300">
      <BlockStack gap="050">
        <Text variant={isRTL ? 'headingMd' : 'headingSm'} as="h2">
          {title}
        </Text>
        <Text variant={isRTL ? 'bodySm' : 'bodyXs'} tone="subdued" as="p">
          {subtitle}
        </Text>
      </BlockStack>
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
