'use client'

import { useId } from 'react'
import {
  BlockStack,
  Box,
  InlineGrid,
  Modal,
  Spinner,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { isolateLtr } from '@/features/billing/domain/planPresentation'
import { useShopifyPlanUpgrade } from '@/features/billing/domain/useShopifyPlanUpgrade'
import { formatPlanPrice } from '@/shared/lib/money'
import { BillingErrorBanner } from './BillingErrorBanner'
import { PlanCard, RADIO_SURFACE_CLASS, radioSurface } from './PlanCard'
import { SharedFeaturesList } from './SharedFeaturesList'

interface UpgradePlansModalProps {
  open: boolean
  title: string
  subtitle?: string
  hostParam: string | null
  onClose: () => void
}

/**
 * The plan picker, offered after the merchant has seen Akeed work: at 80% of
 * the free messages, or when a reinstalled store has no free plan left. Plans
 * differ only in their monthly allowance, so it is a radio group of three
 * allowances; Starter is a row under them while the store can still claim it.
 */
export function UpgradePlansModal({
  open,
  title,
  subtitle,
  hostParam,
  onClose,
}: UpgradePlansModalProps) {
  const t = useTranslations('embeddedOnboarding')
  const tPlans = useTranslations('billing.embeddedPlans')
  const groupName = useId()
  const upgrade = useShopifyPlanUpgrade({ enabled: open, hostParam })
  const starter = upgrade.isFreePlanClaimed ? null : upgrade.starterPlan
  const selectedPlan = upgrade.plans.find(
    (plan) => plan.id === upgrade.selectedPlanId
  )
  const canSubscribe = upgrade.canManageBilling && Boolean(selectedPlan)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="large"
      primaryAction={
        upgrade.canManageBilling && selectedPlan
          ? {
              content:
                selectedPlan.amount === 0
                  ? tPlans('starterCta')
                  : tPlans('subscribeCta', {
                      plan: selectedPlan.name,
                      price: isolateLtr(
                        formatPlanPrice(
                          selectedPlan.amount,
                          selectedPlan.currencyCode
                        )
                      ),
                    }),
              loading: upgrade.isActivating,
              onAction: () => void upgrade.activate(),
            }
          : undefined
      }
      secondaryActions={[{ content: tPlans('cancel'), onAction: onClose }]}
      footer={
        canSubscribe ? (
          <Text as="p" tone="subdued">
            {tPlans('redirectNote')}
          </Text>
        ) : undefined
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
            <>
              <BlockStack gap="100">
                <Text as="h3" variant="headingLg">
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
                        onSelect={upgrade.setSelectedPlanId}
                      />
                    ))}
                  </InlineGrid>
                  {starter && (
                    <label
                      className={`flex items-center gap-3 px-4 py-3 ${RADIO_SURFACE_CLASS}`}
                      style={radioSurface(
                        upgrade.selectedPlanId === starter.id
                      )}
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
              <Text as="p" tone="subdued">
                {tPlans('modalRules')}
                {upgrade.isFreePlanClaimed && ` ${tPlans('freeUsed')}`}
              </Text>
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  )
}
