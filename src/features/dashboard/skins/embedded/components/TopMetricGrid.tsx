import {
  Box,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
  Tooltip,
} from '@shopify/polaris'
import { QuestionCircleIcon } from '@shopify/polaris-icons'

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
  tooltip?: string
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
          <div className="flex min-h-16 flex-col justify-between gap-3">
            <InlineStack gap="200" blockAlign="center" wrap={false}>
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${metricAccentClassNames[metric.tone]}`}
                />
                <span className="min-w-0 truncate">
                  <Text
                    variant={isRTL ? 'headingMd' : 'headingSm'}
                    as="h3"
                    tone="subdued"
                  >
                    {metric.label}
                  </Text>
                </span>
              </span>
              {metric.tooltip ? (
                <Tooltip content={metric.tooltip} preferredPosition="above">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#8a8a8a]">
                    <Icon source={QuestionCircleIcon} tone="subdued" />
                  </span>
                </Tooltip>
              ) : null}
            </InlineStack>
            <Text variant="headingXl" as="h2">
              {metric.value}
            </Text>
          </div>
        </Box>
      ))}
    </InlineGrid>
  )
}
