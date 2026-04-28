import type { KeyboardEvent } from 'react'
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import {
  ArrowRightIcon,
  BookIcon,
  CheckCircleIcon,
  CreditCardIcon,
  InfoIcon,
  LockIcon,
  PlusCircleIcon,
  ReceiptIcon,
  ShieldCheckMarkIcon,
  StarFilledIcon,
} from '@shopify/polaris-icons'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type {
  OnboardingBillingPlan,
  OnboardingBillingPlanId,
} from '@/features/onboarding/domain/onboarding.types'

interface BillingStepProps {
  stepCounterLabel: string
  heading: string
  body: string
  changeLaterNote: string
  selectedPlanDetailsTitle: string
  selectedPlanDetailLines: string[]
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
  trustNote: string
  canManageBilling: boolean
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onActivate: () => void
  onBack: () => void
  onRetry: () => void
  onManageBilling: () => void
}

export function BillingStep({
  stepCounterLabel,
  heading,
  body,
  changeLaterNote,
  selectedPlanDetailsTitle,
  selectedPlanDetailLines,
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
  trustNote,
  canManageBilling,
  onPlanSelect,
  onActivate,
  onBack,
  onRetry,
  onManageBilling,
}: BillingStepProps) {
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)
  const { isRTL } = useLocaleInfo()

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
    <BlockStack gap="500">
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
        <BlockStack gap="400">
          <Box>
            <Badge>{stepCounterLabel}</Badge>
          </Box>

          <BlockStack gap="200">
            <Text as="h2" variant="heading2xl">
              {heading}
            </Text>
            <BlockStack gap="050">
              <Text as="p" tone="subdued" variant="bodyLg">
                {body}
              </Text>
              <Text as="p" tone="subdued" variant="bodyLg">
                {changeLaterNote}
              </Text>
            </BlockStack>
          </BlockStack>
        </BlockStack>

        <InlineGrid columns={{ xs: 1, md: 3 }} gap="500">
          {plans.map((plan) => {
            const isDisabled = disabledPlanIds.includes(plan.id)
            const disabledPlanTooltip = isDisabled
              ? disabledPlanTooltips[plan.id]
              : undefined
            const isSelected = selectedPlanId === plan.id && !isDisabled
            const isRecommended = plan.id === 'pro' && !isDisabled

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

      <BillingDetailsCard
        title={selectedPlanDetailsTitle}
        lines={selectedPlanDetailLines}
      />

      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <Button disabled={isActivating} onClick={onBack}>
            {backLabel}
          </Button>

          <button
            type="button"
            disabled={isActivating || !selectedPlan}
            onClick={onActivate}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#008060] px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#006e52] focus-visible:ring-3 focus-visible:ring-[#008060]/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
          >
            <span>{selectedPlan?.ctaLabel ?? ''}</span>
            <span className={isRTL ? 'rotate-180' : ''} aria-hidden>
              <ArrowRightIcon className="h-5 w-5 fill-current" />
            </span>
          </button>
        </InlineStack>

        <InlineStack align="end" blockAlign="center" gap="150">
          <Icon source={LockIcon} tone="subdued" />
          <Text as="p" tone="subdued" variant="bodySm">
            {trustNote}
          </Text>
        </InlineStack>
      </BlockStack>
    </BlockStack>
  )
}

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

function PlanCard({
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
  const summary =
    plan.id === 'starter'
      ? `~ ${plan.monthlyVolumeLabel}`
      : plan.monthlyVolumeLabel

  return (
    <div
      role="button"
      aria-disabled={isDisabled}
      aria-pressed={isSelected}
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => !isDisabled && onSelect(plan.id)}
      onKeyDown={(event) => !isDisabled && onKeyboardSelect(event, plan.id)}
      className={`min-h-full rounded-xl transition outline-none focus-visible:ring-3 focus-visible:ring-[#008060]/25 ${
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
      }`}
    >
      <div
        className={`flex min-h-[380px] flex-col rounded-xl border bg-white p-6 shadow-xs ${
          isSelected ? 'border-2 border-[#008060]' : 'border-[#d9d9d9]'
        } ${isDisabled ? 'bg-[#fafafa] text-[#8a8a8a]' : ''}`}
      >
        <BlockStack gap="500">
          <InlineStack align="space-between" blockAlign="start" gap="300">
            <Text
              as="h3"
              variant="headingLg"
              tone={isDisabled ? 'subdued' : undefined}
            >
              <span className={isSelected ? 'text-[#008060]' : undefined}>
                {plan.name}
              </span>
            </Text>

            {isDisabled ? (
              <Badge tone="read-only">{freePlanUsedLabel}</Badge>
            ) : isRecommended && recommendedBadgeLabel ? (
              <Badge tone="success-strong" icon={StarFilledIcon}>
                {recommendedBadgeLabel}
              </Badge>
            ) : null}
          </InlineStack>

          <BlockStack gap="200">
            <p dir="auto" className="[unicode-bidi:isolate]">
              <span
                className={`text-[2.45rem] leading-none font-bold tracking-[-0.03em] ${
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

            <Text as="p" tone={isDisabled ? 'subdued' : undefined}>
              {summary}
            </Text>
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
              <InlineStack gap="200" blockAlign="center" wrap={false}>
                <Icon source={InfoIcon} tone="subdued" />
                <Text as="p" variant="bodySm">
                  {disabledReason}
                </Text>
              </InlineStack>
            </div>
          ) : null}
        </BlockStack>
      </div>
    </div>
  )
}

function FeatureRow({
  feature,
  isDisabled,
}: {
  feature: string
  isDisabled: boolean
}) {
  return (
    <InlineStack gap="300" blockAlign="center" wrap={false}>
      <Icon
        source={CheckCircleIcon}
        tone={isDisabled ? 'subdued' : 'success'}
      />
      <Text as="p" tone={isDisabled ? 'subdued' : undefined} variant="bodySm">
        {feature}
      </Text>
    </InlineStack>
  )
}

interface BillingDetailsCardProps {
  title: string
  lines: string[]
}

const billingDetailIcons = [
  ShieldCheckMarkIcon,
  ReceiptIcon,
  PlusCircleIcon,
  CreditCardIcon,
] as const

function BillingDetailsCard({ title, lines }: BillingDetailsCardProps) {
  return (
    <div className="rounded-xl border border-[#d9d9d9] bg-white p-5 shadow-xs">
      <BlockStack gap="400">
        <InlineStack gap="300" blockAlign="center">
          <Icon source={BookIcon} tone="success" />
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
        </InlineStack>

        <InlineGrid columns={{ xs: 1, md: 4 }} gap="0">
          {lines.map((line, index) => {
            const DetailIcon = billingDetailIcons[index] ?? ReceiptIcon

            return (
              <div
                key={line}
                className="border-[#d9d9d9] py-2 md:border-s md:px-5 md:first:border-s-0"
              >
                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f6ef]">
                    <Icon source={DetailIcon} tone="success" />
                  </div>
                  <Text as="p" tone="subdued" variant="bodySm">
                    {line}
                  </Text>
                </InlineStack>
              </div>
            )
          })}
        </InlineGrid>
      </BlockStack>
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
