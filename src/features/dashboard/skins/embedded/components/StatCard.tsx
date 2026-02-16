import {
  Badge,
  BlockStack,
  Box,
  Card,
  Icon,
  InlineStack,
  Text,
} from '@shopify/polaris'
import type { IconSource } from '@shopify/polaris'

export type StatTone = 'base' | 'critical' | 'success' | 'warning' | 'info'

export interface StatCardProps {
  label: string
  value: string | number
  icon: IconSource
  tone?: StatTone
  trend?: {
    value: number
    label: string
    tone: 'critical' | 'success' | 'warning' | 'info'
    // 'base' is not usually used for badges
  }
  footer?: React.ReactNode
}

function getBackground(tone: StatTone) {
  switch (tone) {
    case 'critical':
      return 'bg-surface-critical'
    case 'success':
      return 'bg-surface-success'
    case 'warning':
      return 'bg-surface-warning'
    case 'info':
      return 'bg-surface-info'
    default:
      return 'bg-surface-secondary'
  }
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'base',
  trend,
  footer,
}: StatCardProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start">
          <Text variant="headingSm" as="h3" tone="subdued">
            {label}
          </Text>
          <Box
            background={getBackground(tone)}
            borderRadius="200"
            padding="100"
          >
            <Icon source={icon} tone={tone} />
          </Box>
        </InlineStack>

        <BlockStack gap="200">
          <InlineStack align="space-between" blockAlign="end">
            <Text variant="heading2xl" as="p">
              {String(value)}
            </Text>
            {trend && (
              <Badge tone={trend.tone}>
                {`${trend.value > 0 ? '+' : ''}${trend.value}% ${trend.label}`}
              </Badge>
            )}
          </InlineStack>

          {footer && (
            <Box
              borderBlockStartWidth="025"
              borderColor="border-secondary"
              paddingBlockStart="300"
            >
              {footer}
            </Box>
          )}
        </BlockStack>
      </BlockStack>
    </Card>
  )
}
