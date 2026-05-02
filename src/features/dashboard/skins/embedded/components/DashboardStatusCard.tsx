import { Badge, Box, Card, Icon, InlineStack, Text } from '@shopify/polaris'
import { ShieldCheckMarkIcon } from '@shopify/polaris-icons'

interface DashboardStatusCardProps {
  activeLabel: string
  title: string
}

export function DashboardStatusCard({
  activeLabel,
  title,
}: DashboardStatusCardProps) {
  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center" gap="400">
        <InlineStack gap="300" blockAlign="center">
          <Box
            background="bg-fill-success-secondary"
            borderRadius="200"
            padding="200"
          >
            <Icon source={ShieldCheckMarkIcon} tone="success" />
          </Box>
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
        </InlineStack>

        <Badge tone="success">{activeLabel}</Badge>
      </InlineStack>
    </Card>
  )
}
