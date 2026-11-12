import { Banner, BlockStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { PLAN_NAME_KEYS, useShopifySubscribe } from '@/features/billing'
import type { SendingAvailability } from '@/shared/types/sendingAvailability'
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
  availability,
  canSubscribe = true,
}: {
  capacity: CapacitySummary | null | undefined
  timeZone: string
  hostParam: string | null
  onChoosePlan: () => void
  availability?: SendingAvailability
  canSubscribe?: boolean
}) {
  const tPlans = useTranslations('billing.embeddedPlans')
  const t = useTranslations('shopifyPlanRequired')
  const names = useTranslations('embeddedOnboarding')
  const view = useBlockedOrdersBanner(capacity, timeZone)
  const { subscribe, isSubscribing, error } = useShopifySubscribe(hostParam)
  const noPlan = availability?.reason === 'billing_not_active'
  if (!view && !noPlan) return null
  if (noPlan) {
    const previous =
      availability.lastPlanId && availability.lastPlanId !== 'starter'
        ? availability.lastPlanId
        : null
    const missed = availability.missedOrders?.count ?? 0
    const held = capacity?.blocked_count ?? 0
    return (
      <Banner
        tone="critical"
        title={t('criticalTitle')}
        action={
          canSubscribe
            ? previous
              ? {
                  content: t('subscribe', {
                    plan: names(PLAN_NAME_KEYS[previous]),
                  }),
                  loading: isSubscribing,
                  onAction: () => void subscribe(previous),
                }
              : { content: t('choosePlan'), onAction: onChoosePlan }
            : undefined
        }
        secondaryAction={
          canSubscribe && previous
            ? { content: t('chooseAnother'), onAction: onChoosePlan }
            : undefined
        }
      >
        <BlockStack gap="200">
          <Text as="p">
            {availability.paidThroughAt &&
            availability.planState === 'cancelled'
              ? t('periodEnded')
              : previous && availability.planState === 'cancelled'
                ? t('previousEnded', { plan: names(PLAN_NAME_KEYS[previous]) })
                : t('body')}
          </Text>
          {missed > 0 && (
            <>
              <Text as="p">{t('missed', { count: missed })}</Text>
              <Text as="p" tone="subdued">
                {t('reviewMissed')}
              </Text>
            </>
          )}
          {held > 0 && <Text as="p">{t('held', { count: held })}</Text>}
          {!canSubscribe && <Text as="p">{t('ownerRequired')}</Text>}
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
