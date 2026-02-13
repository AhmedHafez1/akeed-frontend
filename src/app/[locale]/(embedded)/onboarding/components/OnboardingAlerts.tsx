import { Banner, BlockStack } from '@shopify/polaris'

interface OnboardingAlertsProps {
  errorMessage: string | null
  warningMessage: string | null
}

export function OnboardingAlerts({
  errorMessage,
  warningMessage,
}: OnboardingAlertsProps) {
  if (!errorMessage && !warningMessage) {
    return null
  }

  return (
    <BlockStack gap="400">
      {errorMessage && (
        <Banner tone="critical">
          <p>{errorMessage}</p>
        </Banner>
      )}

      {warningMessage && (
        <Banner tone="warning">
          <p>{warningMessage}</p>
        </Banner>
      )}
    </BlockStack>
  )
}
