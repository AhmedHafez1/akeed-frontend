import { useState } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Divider,
  Icon,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { CheckCircleIcon, OrderIcon, SendIcon } from '@shopify/polaris-icons'
import {
  InternationalPhoneInput,
  isValidPhoneNumber,
  type E164Value,
} from '@/shared/ui'

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
  nextStepHint?: string
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
  const [testPhone, setTestPhone] = useState<E164Value | undefined>()

  const isPhoneValid = testPhone ? isValidPhoneNumber(testPhone) : false

  const handleSend = () => {
    if (!onSendTestVerification || !testPhone || !isPhoneValid) return
    onSendTestVerification(testPhone)
  }

  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="500">
        {/* Header */}
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            {messages.heading}
          </Text>
          <Text as="p" tone="subdued" variant="bodyMd">
            {messages.activeDescription}
          </Text>
        </BlockStack>

        {/* How it works — numbered steps */}
        <BlockStack gap="300">
          <EmptyStateStep icon={OrderIcon} text={messages.step1} step={1} />
          <EmptyStateStep icon={SendIcon} text={messages.step2} step={2} />
          <EmptyStateStep
            icon={CheckCircleIcon}
            text={messages.step3}
            step={3}
          />
        </BlockStack>

        {/* Test verification section */}
        {showTestSection && onSendTestVerification && (
          <>
            <Divider />
            <BlockStack gap="300">
              <BlockStack gap="100">
                <Text as="h4" variant="headingSm">
                  {messages.testSectionHeading}
                </Text>
                {messages.nextStepHint && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {messages.nextStepHint}
                  </Text>
                )}
              </BlockStack>
              <InlineStack gap="400" blockAlign="center" align="start" wrap>
                <div className="max-w-105 min-w-65">
                  <InternationalPhoneInput
                    value={testPhone}
                    onChange={setTestPhone}
                    label={messages.testPhoneLabel}
                    placeholder={messages.testPhonePlaceholder}
                    defaultCountry="EG"
                    disabled={isSendingTest}
                  />
                </div>
                <Button
                  variant="primary"
                  loading={isSendingTest}
                  disabled={!isPhoneValid}
                  onClick={handleSend}
                >
                  {isSendingTest
                    ? (messages.testSendingLabel ?? messages.testSendLabel)
                    : messages.testSendLabel}
                </Button>
              </InlineStack>
            </BlockStack>
          </>
        )}
      </BlockStack>
    </Box>
  )
}

interface EmptyStateStepProps {
  icon: typeof OrderIcon
  text: string
  step: number
}

function EmptyStateStep({ icon, text }: EmptyStateStepProps) {
  return (
    <InlineStack gap="300" blockAlign="center" wrap={false}>
      <Box
        background="bg-fill-info-secondary"
        borderRadius="full"
        minWidth="32px"
        minHeight="32px"
      >
        <div className="flex h-8 w-8 items-center justify-center">
          <Icon source={icon} tone="info" />
        </div>
      </Box>
      <BlockStack gap="0">
        <Text as="p" variant="bodySm" fontWeight="medium">
          {text}
        </Text>
      </BlockStack>
    </InlineStack>
  )
}
