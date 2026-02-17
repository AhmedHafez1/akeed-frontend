import type { KeyboardEvent } from 'react'
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Text,
} from '@shopify/polaris'
import type {
  OnboardingBillingPlan,
  OnboardingBillingPlanId,
} from '@/types/embedded-onboarding.model'

interface BillingStepProps {
  heading: string
  body: string
  ctaLabel: string
  selectedBadgeLabel: string
  plans: OnboardingBillingPlan[]
  selectedPlanId: OnboardingBillingPlanId
  isActivating: boolean
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onActivate: () => void
}

export function BillingStep({
  heading,
  body,
  ctaLabel,
  selectedBadgeLabel,
  plans,
  selectedPlanId,
  isActivating,
  onPlanSelect,
  onActivate,
}: BillingStepProps) {
  const handlePlanSelectByKeyboard = (
    event: KeyboardEvent<HTMLDivElement>,
    planId: OnboardingBillingPlanId
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onPlanSelect(planId)
  }

  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Text as="h2" variant="headingLg">
          {heading}
        </Text>
        <Text as="p" tone="subdued" variant="bodyMd">
          {body}
        </Text>
      </BlockStack>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id

          return (
            <div key={plan.id} className="min-h-full">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onPlanSelect(plan.id)}
                onKeyDown={(event) =>
                  handlePlanSelectByKeyboard(event, plan.id)
                }
                className={`block min-h-full cursor-pointer rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/35 ${
                  isSelected ? 'shadow-[0_0_0_2px_rgba(0,127,95,0.45)]' : ''
                }`}
              >
                <Card>
                  <div className="flex min-h-[290px] flex-col justify-between gap-[18px]">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingLg">
                        {plan.name}
                      </Text>
                      {isSelected ? (
                        <Badge tone="success">{selectedBadgeLabel}</Badge>
                      ) : (
                        plan.badge && <Badge>{plan.badge}</Badge>
                      )}
                    </InlineStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="headingXl">
                        {plan.monthlyPriceLabel}
                      </Text>
                      <Text as="p" tone="subdued" variant="bodyMd">
                        {plan.monthlyVolumeLabel}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      {plan.features.map((feature) => (
                        <Text
                          key={`${plan.id}-${feature}`}
                          as="p"
                          variant="bodyMd"
                          className="leading-6"
                        >
                          - {feature}
                        </Text>
                      ))}
                    </BlockStack>
                  </div>
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      <Box>
        <Button variant="primary" loading={isActivating} onClick={onActivate}>
          {ctaLabel}
        </Button>
      </Box>
    </BlockStack>
  )
}
