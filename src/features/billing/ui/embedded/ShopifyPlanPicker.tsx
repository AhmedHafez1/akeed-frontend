'use client'

import { useId } from 'react'
import { BlockStack, Box, InlineGrid, Spinner, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { ownNumberAllowance } from '@/features/billing/domain/planPresentation'
import type { useShopifyPlanUpgrade } from '@/features/billing/domain/useShopifyPlanUpgrade'
import { BillingErrorBanner } from './BillingErrorBanner'
import { PlanCard, RADIO_SURFACE_CLASS, radioSurface } from './PlanCard'
import { SharedFeaturesList } from './SharedFeaturesList'

/** One Shopify picker shared by onboarding and the existing upgrade modal. */
export function ShopifyPlanPicker({
  upgrade,
  ownNumberPresence,
}: {
  upgrade: ReturnType<typeof useShopifyPlanUpgrade>
  ownNumberPresence: { visible: boolean; connected: boolean }
}) {
  const groupName = useId()
  const t = useTranslations('embeddedOnboarding')
  const tPlans = useTranslations('billing.embeddedPlans')
  const starter = upgrade.isFreePlanClaimed ? null : upgrade.starterPlan
  const showsOwnNumber = upgrade.paidPlans.some((plan) =>
    Boolean(ownNumberAllowance(plan, ownNumberPresence))
  )
  if (upgrade.isLoading)
    return <Spinner accessibilityLabel={tPlans('heading')} />
  if (upgrade.loadError)
    return (
      <BillingErrorBanner
        message={t('billingActivationError')}
        retryLabel={t('billingTryAgain')}
        onRetry={upgrade.retryPlans}
      />
    )
  return (
    <BlockStack gap="400">
      {upgrade.error && (
        <BillingErrorBanner
          message={upgrade.error}
          retryLabel={t('billingTryAgain')}
          onRetry={upgrade.clearError}
        />
      )}
      {!upgrade.canManageBilling ? (
        <Text as="p">{t('billingManagementUnavailable')}</Text>
      ) : (
        <>
          <BlockStack gap="100">
            <Text as="h2" variant="headingLg">
              {tPlans('heading')}
            </Text>
            <Text as="p" tone="subdued">
              {tPlans('sameFeatures')}
            </Text>
          </BlockStack>
          <div role="radiogroup" aria-label={tPlans('plansLabel')}>
            <BlockStack gap="300">
              <InlineGrid columns={{ xs: 1, md: 3 }} gap="300">
                {upgrade.paidPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    groupName={groupName}
                    isSelected={upgrade.selectedPlanId === plan.id}
                    isCurrent={upgrade.currentPlanId === plan.id}
                    ownNumber={ownNumberAllowance(plan, ownNumberPresence)}
                    onSelect={upgrade.setSelectedPlanId}
                  />
                ))}
              </InlineGrid>
              {starter && (
                <label
                  className={`flex items-center gap-3 px-4 py-3 ${RADIO_SURFACE_CLASS}`}
                  style={radioSurface(upgrade.selectedPlanId === starter.id)}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={starter.id}
                    checked={upgrade.selectedPlanId === starter.id}
                    onChange={() => upgrade.setSelectedPlanId(starter.id)}
                    className="m-0 h-[18px] w-[18px] shrink-0 cursor-pointer"
                    style={{ accentColor: 'var(--p-color-bg-fill-brand)' }}
                  />
                  <Text as="span">{tPlans('starterRow')}</Text>
                </label>
              )}
            </BlockStack>
          </div>
          <Box
            background="bg-surface-secondary"
            borderRadius="300"
            padding="400"
          >
            <SharedFeaturesList compact />
          </Box>
          {upgrade.isRenewal && <Text as="p">{tPlans('renewNote')}</Text>}
          <Text as="p" tone="subdued">
            {tPlans('modalRules')}
            {showsOwnNumber && ` ${tPlans('ownNumber.note')}`}
            {upgrade.isFreePlanClaimed && ` ${tPlans('freeUsed')}`}
          </Text>
        </>
      )}
    </BlockStack>
  )
}
