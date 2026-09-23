import { BlockStack, Icon, InlineStack, Text } from '@shopify/polaris'
import { CheckIcon } from '@shopify/polaris-icons'

import type {
  TimelineRow,
  TimelineRowState,
} from '@/features/onboarding/model/onboardingTest'

interface DeliveryStatusTimelineProps {
  rows: ReadonlyArray<TimelineRow>
}

function Marker({ state, index }: { state: TimelineRowState; index: number }) {
  if (state === 'done') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--p-color-bg-fill-success-secondary) text-(--p-color-icon-success)">
        <Icon source={CheckIcon} tone="inherit" />
      </span>
    )
  }
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
        state === 'current'
          ? 'border-(--p-color-bg-fill-success) text-(--p-color-text-success)'
          : 'border-(--p-color-border) text-(--p-color-text-secondary)'
      }`}
    >
      {index + 1}
    </span>
  )
}

/**
 * The live progress of the onboarding test, as numbered cues so the merchant
 * always knows what they are waiting for and what they need to do.
 */
export function DeliveryStatusTimeline({ rows }: DeliveryStatusTimelineProps) {
  return (
    <ol className="flex flex-col gap-4" aria-live="polite">
      {rows.map((row, index) => {
        const isEmphasized = row.isAction && row.state === 'current'
        return (
          <li
            key={row.id}
            aria-current={row.state === 'current' ? 'step' : undefined}
            className={
              isEmphasized
                ? '-mx-3 rounded-(--p-border-radius-300) bg-(--p-color-bg-surface-success) px-3 py-3'
                : undefined
            }
          >
            <InlineStack
              align="space-between"
              blockAlign="center"
              gap="300"
              wrap={false}
            >
              <InlineStack gap="300" blockAlign="center" wrap={false}>
                <Marker state={row.state} index={index} />
                <BlockStack gap="050">
                  <Text
                    as="span"
                    variant={isEmphasized ? 'headingMd' : 'bodyMd'}
                    fontWeight={
                      row.state === 'upcoming' ? 'regular' : 'semibold'
                    }
                    tone={row.state === 'upcoming' ? 'subdued' : undefined}
                  >
                    {row.label}
                  </Text>
                  {row.note && (
                    <Text as="span" variant="bodySm" tone="subdued">
                      {row.note}
                    </Text>
                  )}
                </BlockStack>
              </InlineStack>
              {row.timeLabel && (
                <Text as="span" variant="bodySm" tone="subdued">
                  {row.timeLabel}
                </Text>
              )}
            </InlineStack>
          </li>
        )
      })}
    </ol>
  )
}
