'use client'

import type { KeyboardEvent } from 'react'
import { BlockStack, InlineGrid, Modal, Spinner, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useShopifyPlanUpgrade } from '@/features/billing/domain/useShopifyPlanUpgrade'
import {
  RECOMMENDED_SHOPIFY_PLAN_ID,
  type ShopifyPlanId,
} from '@/features/billing/domain/shopifyPlans'
import { BillingErrorBanner } from './BillingErrorBanner'
import { PlanCard } from './PlanCard'

interface UpgradePlansModalProps {
  open: boolean
  title: string
  subtitle?: string
  hostParam: string | null
  onClose: () => void
}

/**
 * The plan picker, offered after the merchant has seen Akeed work: at 80% of
 * the free messages, or when a reinstalled store has no free plan left.
 */
export function UpgradePlansModal({
  open,
  title,
  subtitle,
  hostParam,
  onClose,
}: UpgradePlansModalProps) {
  const t = useTranslations('embeddedOnboarding')
  const tOnboarding = useTranslations('onboarding')
  const upgrade = useShopifyPlanUpgrade({ enabled: open, hostParam })
  const selectedPlan = upgrade.plans.find(
    (plan) => plan.id === upgrade.selectedPlanId
  )

  const handleKeyboardSelect = (
    event: KeyboardEvent<HTMLDivElement>,
    planId: ShopifyPlanId
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    upgrade.setSelectedPlanId(planId)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="large"
      primaryAction={
        upgrade.canManageBilling && selectedPlan
          ? {
              content: selectedPlan.ctaLabel,
              loading: upgrade.isActivating,
              onAction: () => void upgrade.activate(),
            }
          : undefined
      }
    >
      <Modal.Section>
        <BlockStack gap="400">
          {subtitle && (
            <Text as="p" tone="subdued">
              {subtitle}
            </Text>
          )}
          {upgrade.error && (
            <BillingErrorBanner
              message={upgrade.error}
              retryLabel={t('billingTryAgain')}
              onRetry={upgrade.clearError}
            />
          )}
          {upgrade.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner accessibilityLabel={title} />
            </div>
          ) : !upgrade.canManageBilling ? (
            <Text as="p">{t('billingManagementUnavailable')}</Text>
          ) : (
            <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
              {upgrade.plans.map((plan) => {
                const isDisabled =
                  plan.id === 'starter' && upgrade.isFreePlanClaimed
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isDisabled={isDisabled}
                    isSelected={
                      upgrade.selectedPlanId === plan.id && !isDisabled
                    }
                    isRecommended={
                      plan.id === RECOMMENDED_SHOPIFY_PLAN_ID && !isDisabled
                    }
                    disabledReason={
                      isDisabled
                        ? t('freePlanAlreadyClaimedTooltip')
                        : undefined
                    }
                    recommendedBadgeLabel={tOnboarding('recommendedBadge')}
                    freePlanUsedLabel={t('freePlanUsedBadge')}
                    onSelect={upgrade.setSelectedPlanId}
                    onKeyboardSelect={handleKeyboardSelect}
                  />
                )
              })}
            </InlineGrid>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  )
}
