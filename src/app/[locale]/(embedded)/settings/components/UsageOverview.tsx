import {
  Badge,
  BlockStack,
  Box,
  InlineStack,
  ProgressBar,
  Text,
} from '@shopify/polaris'

interface UsageOverviewProps {
  used: number
  limit: number
  title: string
  usedLabel: string
  limitLabel: string
  upgradePrompt: string | null
}

function resolveUsageTone(percent: number): 'success' | 'critical' {
  return percent >= 80 ? 'critical' : 'success'
}

export function UsageOverview({
  used,
  limit,
  title,
  usedLabel,
  limitLabel,
  upgradePrompt,
}: UsageOverviewProps) {
  const safeLimit = Math.max(limit, 1)
  const usagePercent = Math.min(100, Math.round((used / safeLimit) * 100))
  const tone = resolveUsageTone(usagePercent)

  return (
    <BlockStack gap="300">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        <Badge tone={tone}>{usedLabel}</Badge>
      </InlineStack>

      <ProgressBar progress={usagePercent} size="small" tone={tone} />

      <InlineStack align="space-between">
        <Text as="p" variant="bodySm" tone="subdued">
          {used} / {limit}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {limitLabel}
        </Text>
      </InlineStack>

      {upgradePrompt && (
        <Box padding="200" background="bg-surface-warning" borderRadius="200">
          <Text as="p" variant="bodySm" tone="caution">
            {upgradePrompt}
          </Text>
        </Box>
      )}
    </BlockStack>
  )
}
