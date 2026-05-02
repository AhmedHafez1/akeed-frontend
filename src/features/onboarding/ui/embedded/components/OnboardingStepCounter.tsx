import { BlockStack, Box, InlineStack, Text } from '@shopify/polaris'

interface OnboardingStepCounterProps {
  label: string
  currentStep: number
  steps: string[]
}

function getFlowState(currentStep: number, index: number) {
  const activeIndex = currentStep === 3 ? 2 : 0
  const completedIndex = currentStep === 3 ? 1 : -1

  if (index <= completedIndex) {
    return 'completed'
  }

  if (index === activeIndex) {
    return 'active'
  }

  return 'pending'
}

export function OnboardingStepCounter({
  label,
  currentStep,
  steps,
}: OnboardingStepCounterProps) {
  return (
    <BlockStack gap="200">
      <Text as="p" tone="subdued" variant="bodySm">
        {label}
      </Text>

      <InlineStack gap="200" wrap>
        {steps.map((stepLabel, index) => {
          const state = getFlowState(currentStep, index)
          const isActive = state === 'active'
          const isCompleted = state === 'completed'

          return (
            <InlineStack key={stepLabel} gap="200" blockAlign="center">
              <Box
                borderColor={
                  isActive || isCompleted ? 'border-brand' : 'border-secondary'
                }
                borderRadius="300"
                borderWidth="025"
                background={
                  isCompleted
                    ? 'bg-fill-success-secondary'
                    : isActive
                      ? 'bg-fill-success-secondary'
                      : 'bg-surface-secondary'
                }
                paddingInline="300"
                paddingBlock="150"
              >
                <Text
                  as="span"
                  variant="bodySm"
                  fontWeight={isActive ? 'semibold' : 'medium'}
                  tone={isActive || isCompleted ? undefined : 'subdued'}
                >
                  {stepLabel}
                </Text>
              </Box>

              {index < steps.length - 1 && (
                <Text as="span" tone="subdued" variant="bodySm">
                  -&gt;
                </Text>
              )}
            </InlineStack>
          )
        })}
      </InlineStack>
    </BlockStack>
  )
}
