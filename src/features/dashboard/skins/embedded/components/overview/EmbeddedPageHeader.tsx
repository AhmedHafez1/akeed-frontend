import type { ReactNode } from 'react'
import { BlockStack, Select, Text } from '@shopify/polaris'
import type { DateRangeFilterOption } from '../../../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../../../model/dashboard.model'

interface EmbeddedPageHeaderProps {
  /** The page name, or the main tabs standing in for it. */
  title: ReactNode
  titleMetadata?: ReactNode
  /** A line of text, or richer content such as the settings status line. */
  subtitle?: ReactNode
  periodLabel: string
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
}

/**
 * Title and subtitle at the start, the labelled period select at the end.
 * Logical flex order, so the two sides swap by themselves in RTL.
 */
export function EmbeddedPageHeader({
  title,
  titleMetadata,
  subtitle,
  periodLabel,
  period,
  periodOptions,
  onPeriodChange,
}: EmbeddedPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <BlockStack gap="200">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {typeof title === 'string' ? (
            <Text as="h1" variant="headingXl">
              {title}
            </Text>
          ) : (
            title
          )}
          {titleMetadata}
        </div>
        {typeof subtitle === 'string' ? (
          <Text as="p" variant="bodyMd" tone="subdued">
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </BlockStack>
      <div className="shrink-0 md:min-w-48">
        <Select
          label={periodLabel}
          labelInline
          options={periodOptions.map((option) => ({
            label: option.label,
            value: option.id,
          }))}
          value={period}
          onChange={(value) => onPeriodChange(value as DashboardStatsDateRange)}
        />
      </div>
    </div>
  )
}
