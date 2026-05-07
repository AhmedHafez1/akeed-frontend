import type { KeyboardEvent } from 'react'
import { Badge, BlockStack, Divider, Icon, Text } from '@shopify/polaris'
import { InfoIcon } from '@shopify/polaris-icons'
import type {
  OnboardingBillingPlan,
  OnboardingBillingPlanId,
} from '@/features/onboarding/domain/onboarding.types'
import { FeatureRow } from './FeatureRow'

interface PlanCardProps {
  plan: OnboardingBillingPlan
  isDisabled: boolean
  isSelected: boolean
  isRecommended: boolean
  disabledReason?: string
  recommendedBadgeLabel?: string
  freePlanUsedLabel: string
  onSelect: (planId: OnboardingBillingPlanId) => void
  onKeyboardSelect: (
    event: KeyboardEvent<HTMLDivElement>,
    planId: OnboardingBillingPlanId
  ) => void
}

export function PlanCard({
  plan,
  isDisabled,
  isSelected,
  isRecommended,
  disabledReason,
  recommendedBadgeLabel,
  freePlanUsedLabel,
  onSelect,
  onKeyboardSelect,
}: PlanCardProps) {
  const { price, cadence } = splitPriceLabel(plan.monthlyPriceLabel)

  return (
    <div
      role="button"
      aria-disabled={isDisabled}
      aria-pressed={isSelected}
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => !isDisabled && onSelect(plan.id)}
      onKeyDown={(event) => !isDisabled && onKeyboardSelect(event, plan.id)}
      className={`h-full rounded-lg transition outline-none focus-visible:ring-3 focus-visible:ring-[#008060]/25 ${
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
      }`}
    >
      <div
        className={`flex h-full min-h-[360px] flex-col rounded-lg border bg-white p-5 shadow-xs transition ring-inset md:p-6 ${
          isSelected
            ? 'border-[#008060] bg-[#f7fbf9] ring-1 ring-[#008060]'
            : 'border-[#d9d9d9] ring-1 ring-transparent'
        } ${isDisabled ? 'bg-[#fafafa] text-[#8a8a8a]' : ''}`}
      >
        <BlockStack gap="400">
          <div className="flex items-start justify-between gap-3 text-start">
            <div className="min-w-0">
              <Text
                as="h3"
                variant="headingMd"
                tone={isDisabled ? 'subdued' : undefined}
              >
                <span className={isSelected ? 'text-[#008060]' : undefined}>
                  {plan.name}
                </span>
              </Text>
            </div>

            {isDisabled ? (
              <div className="shrink-0">
                <Badge tone="read-only">{freePlanUsedLabel}</Badge>
              </div>
            ) : isRecommended && recommendedBadgeLabel ? (
              <div className="shrink-0">
                <Badge tone="success">{recommendedBadgeLabel}</Badge>
              </div>
            ) : null}
          </div>

          <BlockStack gap="200">
            <p dir="auto" className="text-start [unicode-bidi:isolate]">
              <span
                className={`text-[1.5rem] leading-none font-bold tracking-normal ${
                  isDisabled ? 'text-[#8a8a8a]' : 'text-[#202223]'
                }`}
              >
                {price}
              </span>
              {cadence ? (
                <span
                  className={`ms-2 text-base ${
                    isDisabled ? 'text-[#8a8a8a]' : 'text-[#202223]'
                  }`}
                >
                  {cadence}
                </span>
              ) : null}
            </p>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            {plan.features.map((feature) => (
              <FeatureRow
                key={feature}
                feature={feature}
                isDisabled={isDisabled}
              />
            ))}
          </BlockStack>

          {isDisabled && disabledReason ? (
            <div className="mt-auto rounded-lg bg-[#f1f1f1] px-3 py-3">
              <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2 text-start">
                <span className="flex h-5 w-5 items-center justify-center">
                  <Icon source={InfoIcon} tone="subdued" />
                </span>
                <Text as="p" variant="bodySm">
                  {disabledReason}
                </Text>
              </div>
            </div>
          ) : null}
        </BlockStack>
      </div>
    </div>
  )
}

function splitPriceLabel(label: string) {
  if (label.includes(' / ')) {
    const [price, ...cadenceParts] = label.split(' / ')
    return { price, cadence: `/ ${cadenceParts.join(' / ')}` }
  }

  if (label.includes('/')) {
    const [price, ...cadenceParts] = label.split('/')
    return { price, cadence: `/ ${cadenceParts.join('/')}` }
  }

  return { price: label, cadence: '' }
}
