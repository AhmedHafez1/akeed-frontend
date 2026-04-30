import { Box, InlineGrid, InlineStack, Text } from '@shopify/polaris'

export type PolarisTextTone = 'success' | 'critical' | 'caution' | 'subdued'
export type MetricTone = Exclude<PolarisTextTone, 'subdued'>
export type PolarisBorderColor =
  | 'border-success'
  | 'border-critical'
  | 'border-caution'

export interface TopMetric {
  id: 'confirmed' | 'canceled' | 'awaitingResponse' | 'responseRate' | 'confirmationRate'
  label: string
  value: string
  tone: MetricTone
  borderColor: PolarisBorderColor
}

interface TopMetricGridProps {
  metrics: TopMetric[]
  isRTL: boolean
}

export function TopMetricGrid({ metrics, isRTL }: TopMetricGridProps) {
  return (
    <InlineGrid columns={{ xs: 1, md: 5 }} gap="400">
      {metrics.map((metric) => (
        <Box
          key={metric.id}
          background="bg-surface"
          borderColor={metric.borderColor}
          borderRadius="300"
          borderWidth="025"
          padding="300"
          shadow="100"
        >
          <InlineStack align="space-between" blockAlign="center">
            <Text
              variant={isRTL ? 'headingMd' : 'headingSm'}
              as="h3"
              tone={metric.tone}
            >
              {metric.label}
            </Text>
            <Text variant="headingXl" as="h2">
              {metric.value}
            </Text>
          </InlineStack>
        </Box>
      ))}
    </InlineGrid>
  )
}
