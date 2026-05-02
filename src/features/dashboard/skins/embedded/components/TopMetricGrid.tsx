import { Box, InlineGrid, InlineStack, Text } from '@shopify/polaris'

export type PolarisTextTone = 'success' | 'critical' | 'caution' | 'subdued'
export type MetricTone = Exclude<PolarisTextTone, 'subdued'>

export interface TopMetric {
  id:
    | 'confirmed'
    | 'canceled'
    | 'awaitingResponse'
    | 'responseRate'
    | 'confirmationRate'
  label: string
  value: string
  tone: MetricTone
}

interface TopMetricGridProps {
  metrics: TopMetric[]
  isRTL: boolean
}

const metricAccentClassNames: Record<MetricTone, string> = {
  success: 'bg-[#008060]',
  critical: 'bg-[#8e0b21]',
  caution: 'bg-[#b28400]',
}

export function TopMetricGrid({ metrics, isRTL }: TopMetricGridProps) {
  return (
    <InlineGrid columns={{ xs: 1, md: 5 }} gap="400">
      {metrics.map((metric) => (
        <Box
          key={metric.id}
          background="bg-surface"
          borderColor="border"
          borderRadius="300"
          borderWidth="025"
          padding="300"
          shadow="100"
        >
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${metricAccentClassNames[metric.tone]}`}
              />
              <Text
                variant={isRTL ? 'headingMd' : 'headingSm'}
                as="h3"
                tone="subdued"
              >
                {metric.label}
              </Text>
            </InlineStack>
            <Text variant="headingXl" as="h2">
              {metric.value}
            </Text>
          </InlineStack>
        </Box>
      ))}
    </InlineGrid>
  )
}
