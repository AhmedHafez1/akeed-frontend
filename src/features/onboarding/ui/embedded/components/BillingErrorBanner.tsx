import { Banner, BlockStack, Button, InlineStack } from '@shopify/polaris'

interface BillingErrorBannerProps {
  message: string
  retryLabel: string
  manageSettingsLabel: string
  canManageBilling: boolean
  onRetry: () => void
  onManageBilling: () => void
}

export function BillingErrorBanner({
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
