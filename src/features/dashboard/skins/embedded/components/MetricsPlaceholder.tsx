import { BlockStack, Text } from '@shopify/polaris'

interface MetricsPlaceholderProps {
  title: string
  body: string
}

/** Stands in for empty charts until the first real order has data to show. */
export function MetricsPlaceholder({ title, body }: MetricsPlaceholderProps) {
  return (
    <div className="rounded-(--p-border-radius-300) border border-dashed border-(--p-color-border) px-6 py-10">
      <BlockStack gap="200" inlineAlign="center">
        <Text as="h2" variant="headingMd" alignment="center">
          {title}
        </Text>
        <Text as="p" tone="subdued" alignment="center">
          {body}
        </Text>
      </BlockStack>
    </div>
  )
}
