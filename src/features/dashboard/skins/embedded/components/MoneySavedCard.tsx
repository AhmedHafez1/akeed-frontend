import { BlockStack, Box, Card, InlineStack, Text } from '@shopify/polaris'

interface MoneySavedCardProps {
  title: string
  value: string
  breakdownTitle: string
  breakdownLine: string
  isRTL: boolean
}

export function MoneySavedCard({
  title,
  value,
  breakdownTitle,
  breakdownLine,
  isRTL,
}: MoneySavedCardProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingSm" as="p">
            {title}
          </Text>
          <Text variant="headingXl" as="p">
            {value}
          </Text>
        </InlineStack>

        <Box background="bg-surface-secondary" borderRadius="200" padding="300">
          <BlockStack gap="100">
            <Text variant={isRTL ? 'bodyMd' : 'bodySm'} tone="subdued" as="p">
              {breakdownTitle}
            </Text>
            <Text variant={isRTL ? 'bodySm' : 'bodyXs'} as="p">
              {breakdownLine}
            </Text>
          </BlockStack>
        </Box>
      </BlockStack>
    </Card>
  )
}
