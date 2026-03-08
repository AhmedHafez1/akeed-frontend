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
import type { OnboardingBillingPlanId } from '@/features/onboarding/domain/onboarding.types'

interface PlanOption {
  id: OnboardingBillingPlanId
  name: string
  priceLabel: string
  volumeLabel: string
}

interface PlanComparisonProps {
  plans: PlanOption[]
  currentPlanId: OnboardingBillingPlanId | null
  selectedPlanId: OnboardingBillingPlanId | null
  isChangingPlan: boolean
  currentBadgeLabel: string
  changePlanLabel: string
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onChangePlan: () => void
}

export function PlanComparison({
  plans,
  currentPlanId,
  selectedPlanId,
  isChangingPlan,
  currentBadgeLabel,
  changePlanLabel,
  onPlanSelect,
  onChangePlan,
}: PlanComparisonProps) {
  const hasSelection =
    selectedPlanId !== null && selectedPlanId !== currentPlanId

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    planId: OnboardingBillingPlanId
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onPlanSelect(planId)
  }

  return (
    <BlockStack gap="400">
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isSelected = plan.id === selectedPlanId

          return (
            <div key={plan.id} className="min-h-full">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onPlanSelect(plan.id)}
                onKeyDown={(e) => handleKeyDown(e, plan.id)}
                className={`block min-h-full cursor-pointer rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/35 ${
                  isSelected ? 'shadow-[0_0_0_3px_rgba(0,160,70,0.7)]' : ''
                }`}
              >
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingSm" tone="subdued">
                        {plan.name}
                      </Text>
                      {isCurrent && (
                        <Badge tone="info">{currentBadgeLabel}</Badge>
                      )}
                    </InlineStack>

                    <Text as="p" variant="headingLg">
                      <span
                        dir="auto"
                        className="block text-center [unicode-bidi:isolate]"
                      >
                        {plan.priceLabel}
                      </span>
                    </Text>

                    <Text as="p" tone="subdued" variant="bodySm">
                      {plan.volumeLabel}
                    </Text>
                  </BlockStack>
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      {hasSelection && (
        <Box>
          <Button
            variant="primary"
            loading={isChangingPlan}
            onClick={onChangePlan}
          >
            {changePlanLabel}
          </Button>
        </Box>
      )}
    </BlockStack>
  )
}
