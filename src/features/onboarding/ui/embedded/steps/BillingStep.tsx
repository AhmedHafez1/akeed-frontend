import type { KeyboardEvent } from 'react'
import {
  Banner,
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
} from '@/features/onboarding/domain/onboarding.types'

interface BillingStepProps {
  heading: string
  body: string
  ctaLabel: string
  plans: OnboardingBillingPlan[]
  selectedPlanId: OnboardingBillingPlanId
  isActivating: boolean
  disabledPlanIds?: OnboardingBillingPlanId[]
  disabledPlanTooltips?: Partial<Record<OnboardingBillingPlanId, string>>
  recommendedBadgeLabel?: string
  errorMessage: string | null
  retryLabel: string
  manageSettingsLabel: string
  canManageBilling: boolean
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onActivate: () => void
  onRetry: () => void
  onManageBilling: () => void
}

export function BillingStep({
  heading,
  body,
  ctaLabel,
  plans,
  selectedPlanId,
  isActivating,
  disabledPlanIds = [],
  disabledPlanTooltips = {},
  recommendedBadgeLabel,
  errorMessage,
  retryLabel,
  manageSettingsLabel,
  canManageBilling,
  onPlanSelect,
  onActivate,
  onRetry,
  onManageBilling,
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

      <BlockStack gap="200">
        <Text as="h2" variant="headingLg">
          {heading}
        </Text>
        <Text as="p" tone="subdued" variant="bodyMd">
          {body}
        </Text>
      </BlockStack>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isDisabled = disabledPlanIds.includes(plan.id)
          const disabledPlanTooltip = isDisabled
            ? disabledPlanTooltips[plan.id]
            : undefined
          const isSelected = selectedPlanId === plan.id && !isDisabled
          const isRecommended = plan.id === 'pro' && !isDisabled

          return (
            <div key={plan.id} className="relative min-h-full">
              {isRecommended && recommendedBadgeLabel ? (
                <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase shadow-sm">
                  {recommendedBadgeLabel}
                </span>
              ) : null}
              <div
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => !isDisabled && onPlanSelect(plan.id)}
                onKeyDown={(event) =>
                  !isDisabled && handlePlanSelectByKeyboard(event, plan.id)
                }
                title={disabledPlanTooltip}
                className={`block min-h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/35 ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                } ${isSelected ? 'shadow-[0_0_0_3px_rgba(0,160,70,0.7)]' : ''}`}
              >
                <Card>
                  <div className="flex min-h-64 flex-col justify-between gap-4.5">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingLg" tone="subdued">
                        {plan.name}
                      </Text>
                      {isSelected ? (
                        <span
                          aria-label="Selected plan"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
                        >
                          &#10003;
                        </span>
                      ) : null}
                    </InlineStack>

                    <Text as="h4" variant="headingXl">
                      <span
                        dir="auto"
                        className="block text-center [unicode-bidi:isolate]"
                      >
                        {plan.monthlyPriceLabel}
                      </span>
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" tone="subdued" variant="bodyLg">
                        {plan.monthlyVolumeLabel}
                      </Text>
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

interface BillingErrorBannerProps {
  message: string
  retryLabel: string
  manageSettingsLabel: string
  canManageBilling: boolean
  onRetry: () => void
  onManageBilling: () => void
}

function BillingErrorBanner({
  message,
  retryLabel,
  manageSettingsLabel,
  canManageBilling,
  onRetry,
  onManageBilling,
}: BillingErrorBannerProps) {
  return (
    <Banner tone="critical" onDismiss={onRetry}>
      <BlockStack gap="300">
        <p>{message}</p>
        <InlineStack gap="300" blockAlign="center">
          <Button size="slim" onClick={onRetry}>
            {retryLabel}
          </Button>
          {canManageBilling && (
            <Button size="slim" variant="plain" onClick={onManageBilling}>
              {manageSettingsLabel}
            </Button>
          )}
        </InlineStack>
      </BlockStack>
    </Banner>
  )
}
