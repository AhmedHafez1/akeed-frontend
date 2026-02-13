import { BlockStack, Box, Button, Text } from '@shopify/polaris'

interface BillingStepProps {
  heading: string
  body: string
  ctaLabel: string
  isActivating: boolean
  onActivate: () => void
}

export function BillingStep({
  heading,
  body,
  ctaLabel,
  isActivating,
  onActivate,
}: BillingStepProps) {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Text as="h2" variant="headingLg">
          {heading}
        </Text>
        <Text as="p" tone="subdued" variant="bodyMd">
          {body}
        </Text>
      </BlockStack>

      <Box>
        <Button variant="primary" loading={isActivating} onClick={onActivate}>
          {ctaLabel}
        </Button>
      </Box>
    </BlockStack>
  )
}
