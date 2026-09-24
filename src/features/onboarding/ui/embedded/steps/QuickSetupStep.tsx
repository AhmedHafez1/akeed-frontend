import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  InlineError,
  InlineStack,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import { InternationalPhoneInput, type E164Value } from '@/shared/ui'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding/domain/onboarding.types'

interface SelectOption {
  label: string
  value: string
}

export interface QuickSetupStepMessages {
  heading: string
  subheading: string
  freePlanTitle: string
  freePlanDescription: string
  freePlanUsedTitle: string
  freePlanUsedDescription: string
  storeNameLabel: string
  languageLabel: string
  phoneLabel: string
  phoneHelp: string
  autoVerifyLabel: string
  autoVerifyDescription: string
  autoVerifyConsent: string
  submitLabel: string
  durationHint: string
}

interface QuickSetupStepProps {
  messages: QuickSetupStepMessages
  languageOptions: SelectOption[]
  isFreePlanAvailable: boolean
  storeName: string
  storeNameError?: string
  defaultLanguage: IntegrationOnboardingLanguage
  merchantPhone: string
  phoneError?: string
  isAutoVerifyEnabled: boolean
  isSubmitting: boolean
  onStoreNameChange: (value: string) => void
  onLanguageChange: (value: IntegrationOnboardingLanguage) => void
  onMerchantPhoneChange: (value: string) => void
  onAutoVerifyChange: (value: boolean) => void
  onSubmit: () => void
}

const PHONE_HELP_ID = 'onboarding-phone-help'
const PHONE_ERROR_ID = 'onboarding-phone-error'

/**
 * Step 1: one short form. Everything the merchant needs to see a real message
 * on their own phone, and nothing about plans.
 */
export function QuickSetupStep({
  messages,
  languageOptions,
  isFreePlanAvailable,
  storeName,
  storeNameError,
  defaultLanguage,
  merchantPhone,
  phoneError,
  isAutoVerifyEnabled,
  isSubmitting,
  onStoreNameChange,
  onLanguageChange,
  onMerchantPhoneChange,
  onAutoVerifyChange,
  onSubmit,
}: QuickSetupStepProps) {
  return (
    <BlockStack gap="500">
      <BlockStack gap="200">
        <Text as="h1" variant="heading2xl">
          {messages.heading}
        </Text>
        <Text as="p" variant="bodyLg" tone="subdued">
          {messages.subheading}
        </Text>
      </BlockStack>

      {isFreePlanAvailable ? (
        <Banner tone="success" title={messages.freePlanTitle}>
          <p>{messages.freePlanDescription}</p>
        </Banner>
      ) : (
        <Banner tone="info" title={messages.freePlanUsedTitle}>
          <p>{messages.freePlanUsedDescription}</p>
        </Banner>
      )}

      <Card padding={{ xs: '400', md: '600' }}>
        <BlockStack gap="500">
          <TextField
            label={messages.storeNameLabel}
            value={storeName}
            onChange={onStoreNameChange}
            autoComplete="organization"
            error={storeNameError}
          />

          <Select
            label={messages.languageLabel}
            options={languageOptions}
            value={defaultLanguage}
            onChange={(value) =>
              onLanguageChange(value as IntegrationOnboardingLanguage)
            }
          />

          <BlockStack gap="100">
            <InternationalPhoneInput
              value={(merchantPhone || undefined) as E164Value | undefined}
              onChange={(value) => onMerchantPhoneChange(value ?? '')}
              label={messages.phoneLabel}
              defaultCountry="EG"
              disabled={isSubmitting}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={
                phoneError
                  ? `${PHONE_HELP_ID} ${PHONE_ERROR_ID}`
                  : PHONE_HELP_ID
              }
            />
            <span id={PHONE_HELP_ID}>
              <Text as="span" variant="bodySm" tone="subdued">
                {messages.phoneHelp}
              </Text>
            </span>
            {phoneError && (
              <InlineError message={phoneError} fieldID={PHONE_ERROR_ID} />
            )}
          </BlockStack>

          <Box
            padding="200"
            borderWidth="025"
            borderColor="border"
            borderRadius="300"
          >
            <Checkbox
              label={messages.autoVerifyLabel}
              checked={isAutoVerifyEnabled}
              onChange={onAutoVerifyChange}
              
              helpText={
                <BlockStack gap="100">
                  {isAutoVerifyEnabled && (
                    <span className="px-2 py-1 text-success">
                      {messages.autoVerifyConsent}
                    </span>
                  )}
                </BlockStack>
              }
            />
          </Box>
        </BlockStack>
      </Card>

      <InlineStack align="space-between" blockAlign="center" gap="400">
        <Button
          variant="primary"
          size="large"
          loading={isSubmitting}
          onClick={onSubmit}
        >
          {messages.submitLabel}
        </Button>
        <Text as="span" variant="bodySm" tone="subdued">
          {messages.durationHint}
        </Text>
      </InlineStack>
    </BlockStack>
  )
}
