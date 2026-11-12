'use client'

import { Banner, BlockStack, Button, InlineStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useShopifyPlanUpgrade } from '@/features/billing/domain/useShopifyPlanUpgrade'
import {
  PLAN_NAME_KEYS,
  isolateLtr,
} from '@/features/billing/domain/planPresentation'
import { useOwnNumberPresence } from '@/features/whatsapp-connect'
import type { SendingAvailability } from '@/shared/types/sendingAvailability'
import { formatPlanPrice } from '@/shared/lib/money'
import { ShopifyPlanPicker } from './ShopifyPlanPicker'

export function PlanRequiredStep({
  availability,
  hostParam,
  onChooseLater,
  canSubscribe = true,
}: {
  availability?: SendingAvailability
  hostParam: string | null
  onChooseLater: () => void
  canSubscribe?: boolean
}) {
  const t = useTranslations('shopifyPlanRequired')
  const names = useTranslations('embeddedOnboarding')
  const tPlans = useTranslations('billing.embeddedPlans')
  const upgrade = useShopifyPlanUpgrade({
    enabled: true,
    hostParam,
    preferredPlanId: availability?.lastPlanId,
  })
  const ownNumberPresence = useOwnNumberPresence(true)
  const selected = upgrade.plans.find(
    (plan) => plan.id === upgrade.selectedPlanId
  )
  const previousPaid =
    availability?.planState === 'cancelled' &&
    availability.lastPlanId &&
    availability.lastPlanId !== 'starter'
      ? availability.lastPlanId
      : null
  return (
    <BlockStack gap="500">
      <Text as="h1" variant="headingXl">
        {t('heading')}
      </Text>
      <Banner tone="critical">
        <BlockStack gap="200">
          <Text as="p">
            {availability?.paidThroughAt &&
            availability.planState === 'cancelled'
              ? t('periodEnded')
              : previousPaid
                ? t('previousEnded', {
                    plan: names(PLAN_NAME_KEYS[previousPaid]),
                  })
                : t('body')}
          </Text>
          {!upgrade.isLoading &&
            !upgrade.loadError &&
            upgrade.isFreePlanClaimed && <Text as="p">{t('freeUsed')}</Text>}
        </BlockStack>
      </Banner>
      <ShopifyPlanPicker
        upgrade={upgrade}
        ownNumberPresence={ownNumberPresence}
      />
      {!canSubscribe && <Text as="p">{t('ownerRequired')}</Text>}
      <InlineStack gap="300">
        <Button
          variant="primary"
          loading={upgrade.isActivating}
          disabled={
            !canSubscribe ||
            !selected ||
            !upgrade.canManageBilling ||
            upgrade.loadError
          }
          onClick={() => void upgrade.activate()}
        >
          {selected
            ? selected.amount === 0
              ? tPlans('starterCta')
              : tPlans('subscribeCta', {
                  plan: selected.name,
                  price: isolateLtr(
                    formatPlanPrice(selected.amount, selected.currencyCode)
                  ),
                })
            : t('choosePlan')}
        </Button>
        <Button disabled={upgrade.isActivating} onClick={onChooseLater}>
          {t('chooseLater')}
        </Button>
      </InlineStack>
      <Text as="p" tone="subdued">
        {tPlans('redirectNote')}
      </Text>
    </BlockStack>
  )
}
