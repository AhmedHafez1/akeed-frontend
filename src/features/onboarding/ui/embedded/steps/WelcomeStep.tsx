import { BlockStack, Box, Button, Text } from '@shopify/polaris'

interface WelcomeStepProps {
  heading: string
  body: string
  ctaLabel: string
  onStart: () => void
}

export function WelcomeStep({
  heading,
  body,
  ctaLabel,
  onStart,
}: WelcomeStepProps) {
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
        <Button variant="primary" onClick={onStart}>
          {ctaLabel}
        </Button>
      </Box>
    </BlockStack>
  )
}
