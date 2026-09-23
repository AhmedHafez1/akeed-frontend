import { Fragment } from 'react'
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { ArrowDownIcon, CheckIcon } from '@shopify/polaris-icons'

export interface SetupSuccessStepMessages {
  eyebrow: string
  heading: string
  subheading: string
  pipeline: ReadonlyArray<{ title: string; description: string }>
  exampleTitle: string
  exampleOrderNumber: string
  exampleOrderDetails: string
  exampleTag: string
  dashboardCta: string
  editMessageCta: string
}

interface SetupSuccessStepProps {
  messages: SetupSuccessStepMessages
  onGoToDashboard: () => void
  onEditMessage: () => void
}

/**
 * Closes onboarding by showing the mechanism the merchant just tried, as one
 * pipeline from a new order to an updated Shopify order. Setup is finished;
 * the only next step is the dashboard.
 */
export function SetupSuccessStep({
  messages,
  onGoToDashboard,
  onEditMessage,
}: SetupSuccessStepProps) {
  return (
    <BlockStack gap="600" inlineAlign="center">
      <BlockStack gap="300" inlineAlign="center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-(--p-color-bg-fill-success) text-(--p-color-text-inverse)">
          <span className="h-8 w-8">
            <Icon source={CheckIcon} tone="inherit" />
          </span>
        </span>
        <Badge tone="success">{messages.eyebrow}</Badge>
        <Text as="h1" variant="heading2xl" alignment="center">
          {messages.heading}
        </Text>
        <Text as="p" variant="bodyLg" tone="subdued" alignment="center">
          {messages.subheading}
        </Text>
      </BlockStack>

      <div className="w-full max-w-120">
        <Card padding="500">
          <ol className="flex flex-col items-stretch">
            {messages.pipeline.map((stage, index) => (
              <Fragment key={stage.title}>
                {index > 0 && (
                  <li
                    aria-hidden
                    className="flex justify-center py-1 text-(--p-color-icon-secondary)"
                  >
                    <span className="h-5 w-5">
                      <Icon source={ArrowDownIcon} tone="inherit" />
                    </span>
                  </li>
                )}
                <li>
                  <Box
                    padding="300"
                    borderRadius="300"
                    background={
                      index === 0
                        ? 'bg-surface-success'
                        : 'bg-surface-secondary'
                    }
                  >
                    <InlineStack gap="300" blockAlign="start" wrap={false}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--p-color-bg-fill-success) text-xs font-semibold text-(--p-color-text-inverse)">
                        {index + 1}
                      </span>
                      <BlockStack gap="050">
                        <Text
                          as="span"
                          variant={index === 0 ? 'headingMd' : 'headingSm'}
                        >
                          {stage.title}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {stage.description}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </Box>
                </li>
              </Fragment>
            ))}
          </ol>
        </Card>
      </div>

      <div className="w-full max-w-120">
        <Card padding="400">
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm" tone="subdued">
              {messages.exampleTitle}
            </Text>
            <InlineStack align="space-between" blockAlign="center" gap="200">
              <InlineStack gap="300" blockAlign="center">
                <span dir="ltr">
                  <Text as="span" variant="headingSm">
                    {messages.exampleOrderNumber}
                  </Text>
                </span>
                <Text as="span" variant="bodySm" tone="subdued">
                  {messages.exampleOrderDetails}
                </Text>
              </InlineStack>
              <Badge tone="success">{messages.exampleTag}</Badge>
            </InlineStack>
          </BlockStack>
        </Card>
      </div>

      <InlineStack gap="300" align="center">
        <Button variant="primary" size="large" onClick={onGoToDashboard}>
          {messages.dashboardCta}
        </Button>
        <Button size="large" onClick={onEditMessage}>
          {messages.editMessageCta}
        </Button>
      </InlineStack>
    </BlockStack>
  )
}
