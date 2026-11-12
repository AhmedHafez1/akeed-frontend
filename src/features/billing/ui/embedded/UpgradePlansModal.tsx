'use client'

import { BlockStack, Modal, Text } from '@shopify/polaris'
import { useFormatter, useTranslations } from 'next-intl'
import { isolateLtr } from '@/features/billing/domain/planPresentation'
import { useShopifyPlanUpgrade } from '@/features/billing/domain/useShopifyPlanUpgrade'
import { useOwnNumberPresence } from '@/features/whatsapp-connect'
import { formatPlanPrice } from '@/shared/lib/money'
import { ShopifyPlanPicker } from './ShopifyPlanPicker'

interface UpgradePlansModalProps {
  open: boolean
  title: string
  subtitle?: string
  hostParam: string | null
  preferredPlanId?:
    | import('@/features/billing/domain/shopifyPlans').ShopifyPlanId
    | null
  onClose: () => void
}

/**
 * The plan picker, offered after the merchant has seen Akeed work: at 80% of
 * the free messages, or when a reinstalled store has no free plan left. Plans
 * differ only in their monthly allowance, so it is
 * a radio group of three allowances; Starter is a row under them while the store can still claim it.
 * The current paid plan is marked, and choosing it renews it now.
 */
export function UpgradePlansModal({
  open,
  title,
  subtitle,
  hostParam,
  onClose,
  preferredPlanId,
}: UpgradePlansModalProps) {
  const tPlans = useTranslations('billing.embeddedPlans')
  const format = useFormatter()
  const upgrade = useShopifyPlanUpgrade({
    enabled: open,
    hostParam,
    preferredPlanId,
  })
  const paidThroughDate = upgrade.paidThroughAt
    ? format.dateTime(new Date(upgrade.paidThroughAt), { dateStyle: 'long' })
    : null
  const ownNumberPresence = useOwnNumberPresence(open)
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
                  : upgrade.isKeepingPaidPlan && paidThroughDate
                    ? tPlans('keepCta', {
                        plan: selectedPlan.name,
                        price: isolateLtr(
                          formatPlanPrice(
                            selectedPlan.amount,
                            selectedPlan.currencyCode
                          )
                        ),
                        date: paidThroughDate,
                      })
                    : tPlans(upgrade.isRenewal ? 'renewCta' : 'subscribeCta', {
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
          <ShopifyPlanPicker
            upgrade={upgrade}
            ownNumberPresence={ownNumberPresence}
          />
          {paidThroughDate && (
            <Text as="p">
              {tPlans('paidThroughNote', { date: paidThroughDate })}
            </Text>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  )
}
