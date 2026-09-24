import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { InfoIcon } from '@shopify/polaris-icons'
import {
  WhatsAppPhonePreview,
  type WhatsAppTemplateButton,
} from '@/shared/ui/whatsapp'
import type { TimelineRow } from '@/features/onboarding/model/onboardingTest'
import { DeliveryStatusTimeline } from '../components/DeliveryStatusTimeline'

export interface TestMessageStepMessages {
  heading: string
  subheading: string
  sentToLabel: string
  changeNumber: string
  freeNote: string
  resend: string
  resendIn: (seconds: number) => string
  skip: string
  errorMessage: string | null
  phoneSenderName: string
  phoneSenderStatus: string
  phoneAvatarAlt: string
  phoneDayLabel: string
}

interface TestMessageStepProps {
  messages: TestMessageStepMessages
  phone: string | null
  timeline: ReadonlyArray<TimelineRow>
  previewParagraphs: ReadonlyArray<string>
  previewButtons: ReadonlyArray<WhatsAppTemplateButton>
  previewTimeLabel: string
  previewDir: 'rtl' | 'ltr'
  isAwaitingTap: boolean
  isFailed: boolean
  failedMessage: string
  cooldownSeconds: number
  canResend: boolean
  isSending: boolean
  isSkipping: boolean
  onResend: () => void
  onSkip: () => void
  onChangeNumber: () => void
}

/**
 * Step 2, the aha moment: the message the merchant's customers will get, on
 * the merchant's own phone, with a live view of it arriving and being
 * answered. The test is the product working, so it leads and skip stays quiet.
 */
export function TestMessageStep({
  messages,
  phone,
  timeline,
  previewParagraphs,
  previewButtons,
  previewTimeLabel,
  previewDir,
  isAwaitingTap,
  isFailed,
  failedMessage,
  cooldownSeconds,
  canResend,
  isSending,
  isSkipping,
  onResend,
  onSkip,
  onChangeNumber,
}: TestMessageStepProps) {
  const isCoolingDown = cooldownSeconds > 0

  return (
    <InlineGrid columns={{ xs: 1, md: ['twoThirds', 'oneThird'] }} gap="600">
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="h1" variant="heading2xl">
            {messages.heading}
          </Text>
          <Text as="p" variant="bodyLg" tone="subdued">
            {messages.subheading}
          </Text>
        </BlockStack>

        {messages.errorMessage && (
          <Banner tone="warning">
            <p>{messages.errorMessage}</p>
          </Banner>
        )}
        {isFailed && (
          <Banner tone="critical">
            <p>{failedMessage}</p>
          </Banner>
        )}

        <Card padding={{ xs: '400', md: '500' }}>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center" gap="300">
              <BlockStack gap="050">
                <Text as="span" variant="bodySm" tone="subdued">
                  {messages.sentToLabel}
                </Text>
                <span dir="ltr" className="text-start">
                  <Text as="span" variant="headingMd">
                    {phone ?? ''}
                  </Text>
                </span>
              </BlockStack>
              <Button variant="plain" onClick={onChangeNumber}>
                {messages.changeNumber}
              </Button>
            </InlineStack>
            <Box
              borderBlockStartWidth="025"
              borderColor="border"
              paddingBlockStart="400"
            >
              <DeliveryStatusTimeline rows={timeline} />
            </Box>
          </BlockStack>
        </Card>

        <Box
          padding="300"
          borderWidth="025"
          borderColor="border"
          borderRadius="300"
          background="bg-surface"
        >
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <span className="shrink-0">
              <Icon source={InfoIcon} tone="subdued" />
            </span>
            <Text as="p" variant="bodySm" tone="subdued">
              {messages.freeNote}
            </Text>
          </InlineStack>
        </Box>

        <InlineStack gap="400" blockAlign="center">
          <Button
            onClick={onResend}
            loading={isSending}
            disabled={isCoolingDown || !canResend}
          >
            {isCoolingDown
              ? messages.resendIn(cooldownSeconds)
              : messages.resend}
          </Button>
          <Button
            variant="monochromePlain"
            onClick={onSkip}
            loading={isSkipping}
          >
            {messages.skip}
          </Button>
        </InlineStack>
      </BlockStack>

      <div className="flex justify-center md:pt-4">
        <WhatsAppPhonePreview
          senderName={messages.phoneSenderName}
          senderStatus={messages.phoneSenderStatus}
          avatarAlt={messages.phoneAvatarAlt}
          dayLabel={messages.phoneDayLabel}
          paragraphs={previewParagraphs}
          timeLabel={previewTimeLabel}
          buttons={previewButtons}
          emphasizedTone={isAwaitingTap ? 'confirm' : undefined}
          messageDir={previewDir}
        />
      </div>
    </InlineGrid>
  )
}
