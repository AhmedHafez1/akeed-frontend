import { useState } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Icon,
  InlineStack,
  Text,
  TextField,
} from '@shopify/polaris'
import { CheckCircleIcon, OrderIcon, SendIcon } from '@shopify/polaris-icons'

interface DashboardEmptyStateMessages {
  heading: string
  activeDescription: string
  step1: string
  step2: string
  step3: string
  testSectionHeading?: string
  testSectionDescription?: string
  testPhoneLabel?: string
  testPhonePlaceholder?: string
  testSendLabel?: string
  testSendingLabel?: string
}

interface DashboardEmptyStateProps {
  messages: DashboardEmptyStateMessages
  showTestSection?: boolean
  isSendingTest?: boolean
  onSendTestVerification?: (customerPhone: string) => void
}

export function DashboardEmptyState({
  messages,
  showTestSection = false,
  isSendingTest = false,
  onSendTestVerification,
}: DashboardEmptyStateProps) {
  const [testPhone, setTestPhone] = useState('')

  const handleSend = () => {
    if (!onSendTestVerification) return
    onSendTestVerification(testPhone)
  }

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

      {showTestSection && onSendTestVerification && (
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            {messages.testSectionHeading}
          </Text>
          <Text as="p" tone="subdued" variant="bodySm">
            {messages.testSectionDescription}
          </Text>
          <InlineStack gap="300" blockAlign="end" wrap>
            <div className="max-w-105 min-w-65 flex-1">
              <TextField
                label={messages.testPhoneLabel ?? ''}
                value={testPhone}
                onChange={setTestPhone}
                placeholder={messages.testPhonePlaceholder}
                autoComplete="tel"
              />
            </div>
            <Button
              variant="primary"
              loading={isSendingTest}
              onClick={handleSend}
            >
              {messages.testSendLabel}
            </Button>
          </InlineStack>
        </BlockStack>
      )}
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
