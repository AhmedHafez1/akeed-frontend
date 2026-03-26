import {
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding/domain/onboarding.types'

interface LanguageOption {
  label: string
  value: string
}

interface ConfigurationStepProps {
  heading: string
  storeNameLabel: string
  storeName: string
  storeNameError?: string
  appLanguageLabel: string
  appLanguageOptions: LanguageOption[]
  appLanguage: string
  defaultLanguageLabel: string
  languageOptions: LanguageOption[]
  defaultLanguage: IntegrationOnboardingLanguage
  autoVerifyLabel: string
  autoVerifyDescription: string
  continueLabel: string
  isAutoVerifyEnabled: boolean
  isSaving: boolean
  onStoreNameChange: (value: string) => void
  onAppLanguageChange: (value: string) => void
  onLanguageChange: (value: IntegrationOnboardingLanguage) => void
  onAutoVerifyChange: (value: boolean) => void
  onContinue: () => void
}

export function ConfigurationStep({
  heading,
  storeNameLabel,
  storeName,
  storeNameError,
  appLanguageLabel,
  appLanguageOptions,
  appLanguage,
  defaultLanguageLabel,
  languageOptions,
  defaultLanguage,
  autoVerifyLabel,
  autoVerifyDescription,
  continueLabel,
  isAutoVerifyEnabled,
  isSaving,
  onStoreNameChange,
  onAppLanguageChange,
  onLanguageChange,
  onAutoVerifyChange,
  onContinue,
}: ConfigurationStepProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingLg">
        {heading}
      </Text>

      <TextField
        label={storeNameLabel}
        value={storeName}
        onChange={onStoreNameChange}
        autoComplete="organization"
        error={storeNameError}
      />

      <Select
        label={appLanguageLabel}
        options={appLanguageOptions}
        value={appLanguage}
        onChange={onAppLanguageChange}
      />

      <Select
        label={defaultLanguageLabel}
        options={languageOptions}
        value={defaultLanguage}
        onChange={(value) => onLanguageChange(value as IntegrationOnboardingLanguage)}
      />

      <Card>
        <BlockStack gap="200">
          <Checkbox
            label={autoVerifyLabel}
            checked={isAutoVerifyEnabled}
            onChange={onAutoVerifyChange}
          />
          <Text as="p" tone="subdued" variant="bodySm">
            {autoVerifyDescription}
          </Text>
        </BlockStack>
      </Card>

      <Box>
        <Button variant="primary" loading={isSaving} onClick={onContinue}>
          {continueLabel}
        </Button>
      </Box>
    </BlockStack>
  )
}
