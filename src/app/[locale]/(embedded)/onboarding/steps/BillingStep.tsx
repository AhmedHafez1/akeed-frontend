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

      <InlineStack align="start" gap="300" wrap>
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id

          return (
            <div key={plan.id} className="flex-1-1-220px min-w-220px">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onPlanSelect(plan.id)}
                onKeyDown={(event) =>
                  handlePlanSelectByKeyboard(event, plan.id)
                }
                className="cursor-pointer"
              >
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingMd">
                        {plan.name}
                      </Text>
                      {isSelected ? (
                        <Badge tone="success">{selectedBadgeLabel}</Badge>
                      ) : (
                        plan.badge && <Badge>{plan.badge}</Badge>
                      )}
                    </InlineStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="headingSm">
                        {plan.monthlyPriceLabel}
                      </Text>
                      <Text as="p" tone="subdued" variant="bodySm">
                        {plan.monthlyVolumeLabel}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      {plan.features.map((feature) => (
                        <Text
                          key={`${plan.id}-${feature}`}
                          as="p"
                          variant="bodySm"
                        >
                          • {feature}
                        </Text>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </div>
            </div>
          )
        })}
      </InlineStack>

      <Box>
        <Button variant="primary" loading={isActivating} onClick={onActivate}>
          {ctaLabel}
        </Button>
      </Box>
    </BlockStack>
  )
}
