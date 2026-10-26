import type { ReactNode } from 'react'
import { BlockStack, Select, Text } from '@shopify/polaris'
import { HEADER_ACTIONS_ATTRIBUTE } from '../../../../domain/useAnchoredPanel'
import type { DateRangeFilterOption } from '../../../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../../../model/dashboard.model'

interface EmbeddedPageHeaderProps {
  /** The page name, or the main tabs standing in for it. */
  title: ReactNode
  titleMetadata?: ReactNode
  /** A line of text, or richer content such as the settings status line. */
  subtitle?: ReactNode
  /** Header tools shown before the period select, such as tips and usage. */
  actions?: ReactNode
  /** Without a period (the first-run placeholder), no select is shown. */
  periodControl?: {
    label: string
    value: DashboardStatsDateRange
    options: ReadonlyArray<DateRangeFilterOption>
    onChange: (period: DashboardStatsDateRange) => void
  }
}

/**
 * Title and subtitle at the start; the header tools and the labelled period
 * select at the end. Logical flex order, so the two sides swap by themselves
 * in RTL. Below md the end group moves under the title and wraps, rather than
 * shrinking its labels.
 */
export function EmbeddedPageHeader({
  title,
  titleMetadata,
  subtitle,
  actions,
  periodControl,
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
      {(actions || periodControl) && (
        <div
          {...{ [HEADER_ACTIONS_ATTRIBUTE]: '' }}
          className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end"
        >
          {actions}
          {periodControl && (
            // A pointer press hides the focus ring (see globals.css); a key
            // brings it back, so keyboard focus stays visible.
            <div
              className="akeed-period-select shrink-0 md:min-w-48"
              onPointerDown={(event) => {
                event.currentTarget.dataset.pointerFocus = ''
              }}
              onKeyDown={(event) => {
                delete event.currentTarget.dataset.pointerFocus
              }}
              onBlur={(event) => {
                delete event.currentTarget.dataset.pointerFocus
              }}
            >
              <Select
                label={periodControl.label}
                labelInline
                options={periodControl.options.map((option) => ({
                  label: option.label,
                  value: option.id,
                }))}
                value={periodControl.value}
                onChange={(value) =>
                  periodControl.onChange(value as DashboardStatsDateRange)
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
