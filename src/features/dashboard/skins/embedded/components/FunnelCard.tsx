import {
  BlockStack,
  Box,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@shopify/polaris-icons'

export interface FunnelStep {
  id: 'sent' | 'delivered' | 'read' | 'responded'
  label: string
  value: string
}

interface FunnelCardProps {
  title: string
  subtitle: string
  steps: FunnelStep[]
  isRTL: boolean
}

export function FunnelCard({ title, subtitle, steps, isRTL }: FunnelCardProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="050">
          <Text variant={isRTL ? 'headingMd' : 'headingSm'} as="h2">
            {title}
          </Text>
          <Text variant={isRTL ? 'bodySm' : 'bodyXs'} tone="subdued" as="p">
            {subtitle}
          </Text>
        </BlockStack>

        <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="w-full md:min-w-[85%]">
                <Box
                  padding="300"
                  background="bg-surface-secondary"
                  borderRadius="200"
                  borderWidth="025"
                  borderColor="border-tertiary"
                >
                  <InlineStack blockAlign="center" align="space-between">
                    <Text
                      variant={isRTL ? 'bodyMd' : 'bodySm'}
                      tone="subdued"
                      as="p"
                    >
                      {step.label}
                    </Text>
                    <Text variant="headingLg" as="p">
                      {step.value}
                    </Text>
                  </InlineStack>
                </Box>
              </div>

              {step.id !== 'responded' && (
                <>
                  <div className="flex justify-center md:hidden">
                    <Icon source={ArrowDownIcon} tone="subdued" />
                  </div>
                  <div className="hidden md:flex md:items-center">
                    <Icon
                      source={isRTL ? ArrowLeftIcon : ArrowRightIcon}
                      tone="info"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </InlineGrid>
      </BlockStack>
    </Card>
  )
}
