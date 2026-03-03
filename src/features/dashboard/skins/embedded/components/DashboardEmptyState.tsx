import { BlockStack, Box, Icon, InlineStack, Text } from '@shopify/polaris'
import { CheckCircleIcon, OrderIcon, SendIcon } from '@shopify/polaris-icons'

interface DashboardEmptyStateMessages {
  heading: string
  activeDescription: string
  step1: string
  step2: string
  step3: string
}

interface DashboardEmptyStateProps {
  messages: DashboardEmptyStateMessages
}

export function DashboardEmptyState({ messages }: DashboardEmptyStateProps) {
  return (
    <BlockStack gap="500">
      <BlockStack gap="200">
        <Text as="h3" variant="headingMd">
          {messages.heading}
        </Text>
        <Text as="p" tone="subdued" variant="bodyMd">
          {messages.activeDescription}
        </Text>
      </BlockStack>

      <BlockStack gap="400">
        <EmptyStateStep icon={OrderIcon} text={messages.step1} />
        <EmptyStateStep icon={SendIcon} text={messages.step2} />
        <EmptyStateStep icon={CheckCircleIcon} text={messages.step3} />
      </BlockStack>
    </BlockStack>
  )
}

interface EmptyStateStepProps {
  icon: typeof OrderIcon
  text: string
}

function EmptyStateStep({ icon, text }: EmptyStateStepProps) {
  return (
    <InlineStack gap="300" blockAlign="start" wrap={false}>
      <Box>
        <Icon source={icon} tone="subdued" />
      </Box>
      <Text as="p" variant="bodySm" tone="subdued">
        {text}
      </Text>
    </InlineStack>
  )
}
