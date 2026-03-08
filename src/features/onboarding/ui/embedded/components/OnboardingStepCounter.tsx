import { Text } from '@shopify/polaris'

interface OnboardingStepCounterProps {
  label: string
}

export function OnboardingStepCounter({ label }: OnboardingStepCounterProps) {
  return (
    <Text as="p" tone="subdued" variant="bodySm">
      {label}
    </Text>
  )
}
