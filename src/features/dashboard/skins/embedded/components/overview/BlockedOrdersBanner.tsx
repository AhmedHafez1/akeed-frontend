import { Banner, BlockStack, Text } from '@shopify/polaris'
import { useBlockedOrdersBanner } from '../../../../domain/useBlockedOrdersBanner'
import type { CapacitySummary } from '../../../../model/dashboard.model'

/**
 * Orders kept unsent because the plan allowance ran out. Stays while any are
 * waiting; they send themselves once capacity returns, and choosing a bigger
 * plan is the quickest way there.
 */
export function BlockedOrdersBanner({
  capacity,
  timeZone,
  onChoosePlan,
}: {
  capacity: CapacitySummary | null | undefined
  timeZone: string
  onChoosePlan: () => void
}) {
  const view = useBlockedOrdersBanner(capacity, timeZone)
  if (!view) return null

  return (
    <Banner
      tone="critical"
      title={view.title}
      action={
        view.cta
          ? { content: view.cta.label, onAction: onChoosePlan }
          : undefined
      }
    >
      <BlockStack gap="100">
        <Text as="p">{view.body}</Text>
        <Text as="p" tone="subdued">
          {view.remaining} · {view.note}
        </Text>
      </BlockStack>
    </Banner>
  )
}
