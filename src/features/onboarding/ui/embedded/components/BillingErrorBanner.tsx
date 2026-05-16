import { Banner, BlockStack, Button, InlineStack } from '@shopify/polaris'

interface BillingErrorBannerProps {
  message: string
  retryLabel: string
  onRetry: () => void
}

export function BillingErrorBanner({
  message,
  retryLabel,
  onRetry,
}: BillingErrorBannerProps) {
  return (
    <Banner tone="critical" onDismiss={onRetry}>
      <BlockStack gap="300">
        <p>{message}</p>
        <InlineStack gap="300" blockAlign="center">
          <Button size="slim" onClick={onRetry}>
            {retryLabel}
          </Button>
        </InlineStack>
      </BlockStack>
    </Banner>
  )
}
