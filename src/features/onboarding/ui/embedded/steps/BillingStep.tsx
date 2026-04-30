import type { KeyboardEvent } from 'react'
import {
  BlockStack,
  Button,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import type {
  OnboardingBillingPlan,
  OnboardingBillingPlanId,
} from '@/features/onboarding/domain/onboarding.types'
import { BillingErrorBanner } from '../components/BillingErrorBanner'
import { PlanCard } from '../components/PlanCard'

interface BillingStepProps {
  heading: string
  body: string
  changeLaterNote: string
  plans: OnboardingBillingPlan[]
  selectedPlanId: OnboardingBillingPlanId
  isActivating: boolean
  disabledPlanIds?: OnboardingBillingPlanId[]
  disabledPlanTooltips?: Partial<Record<OnboardingBillingPlanId, string>>
  recommendedBadgeLabel?: string
  errorMessage: string | null
  retryLabel: string
  manageSettingsLabel: string
  freePlanUsedLabel: string
  backLabel: string
  canManageBilling: boolean
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onActivate: () => void
  onBack: () => void
  onRetry: () => void
  onManageBilling: () => void
}

export function BillingStep({
  heading,
  body,
  changeLaterNote,
  plans,
  selectedPlanId,
  isActivating,
  disabledPlanIds = [],
  disabledPlanTooltips = {},
  recommendedBadgeLabel,
  errorMessage,
  retryLabel,
  manageSettingsLabel,
  freePlanUsedLabel,
  backLabel,
  canManageBilling,
  onPlanSelect,
  onActivate,
  onBack,
  onRetry,
  onManageBilling,
}: BillingStepProps) {
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)

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
      {errorMessage && (
        <BillingErrorBanner
          message={errorMessage}
          retryLabel={retryLabel}
          manageSettingsLabel={manageSettingsLabel}
          canManageBilling={canManageBilling}
          onRetry={onRetry}
          onManageBilling={onManageBilling}
        />
      )}

      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">
            {heading}
          </Text>
          <BlockStack gap="050">
            <Text as="p" tone="subdued" variant="bodySm">
              {body}
            </Text>
            <Text as="p" tone="subdued" variant="bodySm">
              {changeLaterNote}
            </Text>
          </BlockStack>
        </BlockStack>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          {plans.map((plan) => {
            const isDisabled = disabledPlanIds.includes(plan.id)
            const disabledPlanTooltip = isDisabled
              ? disabledPlanTooltips[plan.id]
              : undefined
            const isSelected = selectedPlanId === plan.id && !isDisabled
            const isRecommended = plan.id === 'basic' && !isDisabled

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isDisabled={isDisabled}
                isSelected={isSelected}
                isRecommended={isRecommended}
                disabledReason={disabledPlanTooltip}
                recommendedBadgeLabel={recommendedBadgeLabel}
                freePlanUsedLabel={freePlanUsedLabel}
                onSelect={onPlanSelect}
                onKeyboardSelect={handlePlanSelectByKeyboard}
              />
            )
          })}
        </InlineGrid>
      </BlockStack>

      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <Button disabled={isActivating} onClick={onBack}>
            {backLabel}
          </Button>

          <Button
            variant="primary"
            loading={isActivating}
            disabled={!selectedPlan}
            onClick={onActivate}
          >
            {selectedPlan?.ctaLabel ?? ''}
          </Button>
        </InlineStack>
      </BlockStack>
    </BlockStack>
  )
}
