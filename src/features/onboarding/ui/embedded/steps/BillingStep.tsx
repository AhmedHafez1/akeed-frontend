import type { KeyboardEvent } from 'react'
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import {
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
import type {
  OnboardingBillingPlan,
  OnboardingBillingPlanId,
} from '@/features/onboarding/domain/onboarding.types'

interface BillingStepProps {
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

        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
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

          <Button
            variant="primary"
            loading={isActivating}
            disabled={!selectedPlan}
            onClick={onActivate}
          >
            {selectedPlan?.ctaLabel ?? ''}
          </Button>
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
      className={`h-full rounded-lg transition outline-none focus-visible:ring-3 focus-visible:ring-[#008060]/25 ${
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
      }`}
    >
      <div
        className={`flex h-full min-h-[360px] flex-col rounded-lg border bg-white p-5 shadow-xs transition ring-inset md:p-6 ${
          isSelected
            ? 'border-[#008060] ring-2 ring-[#008060]'
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
                <Badge tone="success-strong" icon={StarFilledIcon}>
                  {recommendedBadgeLabel}
                </Badge>
              </div>
            ) : null}
          </div>

          <BlockStack gap="200">
            <p dir="auto" className="text-start [unicode-bidi:isolate]">
              <span
                className={`text-[2rem] leading-none font-bold tracking-normal ${
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

            <Text
              as="p"
              tone={isDisabled ? 'subdued' : undefined}
              variant="bodySm"
            >
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

function FeatureRow({
  feature,
  isDisabled,
}: {
  feature: string
  isDisabled: boolean
}) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-3 text-start">
      <span className="flex h-5 w-5 items-center justify-center">
        <Icon
          source={CheckCircleIcon}
          tone={isDisabled ? 'subdued' : 'success'}
        />
      </span>
      <Text as="p" tone={isDisabled ? 'subdued' : undefined} variant="bodySm">
        {feature}
      </Text>
    </div>
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
  const columnCount = Math.max(lines.length, 1)

  return (
    <div className="rounded-lg border border-[#d9d9d9] bg-white p-5 shadow-xs">
      <BlockStack gap="400">
        <div className="flex items-center gap-3 text-start">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <Icon source={BookIcon} tone="success" />
          </span>
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
        </div>

        <InlineGrid columns={{ xs: 1, md: columnCount }} gap="0">
          {lines.map((line, index) => {
            const DetailIcon = billingDetailIcons[index] ?? ReceiptIcon

            return (
              <div
                key={line}
                className="border-t border-[#d9d9d9] py-3 first:border-t-0 first:pt-0 last:pb-0 md:border-s md:border-t-0 md:px-5 md:py-2 md:first:border-s-0 md:first:ps-0 md:last:pe-0"
              >
                <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 text-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f6ef]">
                    <Icon source={DetailIcon} tone="success" />
                  </div>
                  <Text as="p" tone="subdued" variant="bodySm">
                    {line}
                  </Text>
                </div>
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
