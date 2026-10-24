import { Banner, BlockStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useShopifySubscribe } from '@/features/billing'
import { useBlockedOrdersBanner } from '../../../../domain/useBlockedOrdersBanner'
import type { CapacitySummary } from '../../../../model/dashboard.model'

/**
 * Orders kept unsent because the plan allowance ran out. Stays while any are
 * waiting; they send themselves once capacity returns. Choosing a bigger plan
 * or renewing the current paid plan (straight to Shopify's approval) is the
 * quickest way there.
 */
export function BlockedOrdersBanner({
  capacity,
  timeZone,
  hostParam,
  onChoosePlan,
}: {
  capacity: CapacitySummary | null | undefined
  timeZone: string
  hostParam: string | null
  onChoosePlan: () => void
}) {
  const tPlans = useTranslations('billing.embeddedPlans')
  const view = useBlockedOrdersBanner(capacity, timeZone)
  const { subscribe, isSubscribing, error } = useShopifySubscribe(hostParam)
  if (!view) return null

  const upgradeAction = view.cta
    ? { content: view.cta.label, onAction: onChoosePlan }
    : undefined
  const renew = view.renew
  // Polaris shows no loading state on a secondary action, so the pending
  // request is spelled out below and the hook ignores repeat clicks.
  const renewAction = renew
    ? {
        content: renew.label,
        loading: isSubscribing,
        onAction: () => void subscribe(renew.planId, { renew: true }),
      }
    : undefined

  return (
    <Banner
      tone="critical"
      title={view.title}
      action={upgradeAction ?? renewAction}
      secondaryAction={upgradeAction ? renewAction : undefined}
    >
      <BlockStack gap="100">
        <Text as="p">{view.body}</Text>
        <Text as="p" tone="subdued">
          {view.remaining} · {view.note}
        </Text>
        {isSubscribing && (
          <Text as="p" tone="subdued">
            {tPlans('redirectNote')}
          </Text>
        )}
        {error && (
          <Text as="p" tone="critical">
            {error}
          </Text>
        )}
      </BlockStack>
    </Banner>
  )
}
