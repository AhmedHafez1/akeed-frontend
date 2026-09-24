'use client'

import { useState } from 'react'
import {
  Badge,
  BlockStack,
  Card,
  ChoiceList,
  InlineStack,
  Layout,
  Text,
  TextField,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  ArabicCodTemplateVariantId,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
} from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  PREVIEW_TOTAL_AMOUNT,
  templateOpeningLine,
} from '@/features/settings/domain/messagePreview'
import {
  SETTINGS_FIELD_ID,
  STORE_NAME_MAX_LENGTH,
} from '@/features/settings/domain/settingsForm'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { formatPlanPrice } from '@/shared/lib/money'
import { MessagePreviewCard } from './MessagePreviewCard'

interface MessageTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

function initialPreviewLanguage(data: SettingsResponse): 'ar' | 'en' {
  const language = data.state.defaultLanguage
  if (language === 'ar' || language === 'en') return language
  // "auto" follows the customer's number; the merchant's own number is the
  // best guess for where their customers are.
  return data.state.testSendLanguage ?? 'ar'
}

export function MessageTab({ model, data, readOnly }: MessageTabProps) {
  const t = useTranslations('settings.embedded.message')
  const values = model.values
  const [previewLanguage, setPreviewLanguage] = useState<'ar' | 'en'>(() =>
    initialPreviewLanguage(data)
  )
  if (!values) return null

  const storeName = values.storeName.trim() || 'Akeed Store'
  const sample = {
    customer: PREVIEW_CUSTOMER_NAMES[previewLanguage],
    store: storeName,
    order: PREVIEW_ORDER_NUMBER,
    total: formatPlanPrice(PREVIEW_TOTAL_AMOUNT, data.state.shippingCurrency),
  }
  const variants = data.template.variants[previewLanguage]
  const selectedVariant = values.codTemplateVariants[previewLanguage]
  const selectedDefinition =
    variants.find((variant) => variant.variant === selectedVariant) ??
    variants[0]
  const template =
    selectedDefinition?.preview ?? data.template.previews[previewLanguage]

  const storeNameError =
    model.errors.storeName === 'required'
      ? t('storeNameRequired')
      : model.errors.storeName === 'tooLong'
        ? t('storeNameTooLong', { max: STORE_NAME_MAX_LENGTH })
        : undefined

  const handleLanguageChange = (language: IntegrationOnboardingLanguage) => {
    model.update({ defaultLanguage: language })
    if (language !== 'auto') setPreviewLanguage(language)
  }

  const handleVariantChange = (variant: string) => {
    model.update({
      codTemplateVariants:
        previewLanguage === 'ar'
          ? {
              ...values.codTemplateVariants,
              ar: variant as ArabicCodTemplateVariantId,
            }
          : {
              ...values.codTemplateVariants,
              en: variant as EnglishCodTemplateVariantId,
            },
    })
  }

  return (
    <Layout>
      <Layout.Section>
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('identityHeading')}
              </Text>
              <TextField
                id={SETTINGS_FIELD_ID.storeName}
                label={t('storeNameLabel')}
                value={values.storeName}
                onChange={(storeNameValue) =>
                  model.update({ storeName: storeNameValue })
                }
                autoComplete="organization"
                maxLength={STORE_NAME_MAX_LENGTH}
                requiredIndicator
                disabled={readOnly}
                error={storeNameError}
                helpText={t('storeNameHelp', { name: storeName })}
              />
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('languageHeading')}
              </Text>
              <ChoiceList
                title={t('languageHeading')}
                titleHidden
                disabled={readOnly}
                selected={[values.defaultLanguage]}
                onChange={([language]) =>
                  handleLanguageChange(
                    language as IntegrationOnboardingLanguage
                  )
                }
                choices={[
                  {
                    value: 'auto',
                    label: (
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span">{t('languageAuto')}</Text>
                        <Badge tone="success">{t('recommended')}</Badge>
                      </InlineStack>
                    ),
                    helpText: t('languageAutoHelp'),
                  },
                  { value: 'ar', label: t('languageArabic') },
                  { value: 'en', label: t('languageEnglish') },
                ]}
              />
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  {t('styleHeading')}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t('styleLanguageHint', {
                    language: t(`languageNames.${previewLanguage}`),
                  })}
                </Text>
              </BlockStack>
              <ChoiceList
                title={t('styleHeading')}
                titleHidden
                disabled={readOnly}
                selected={[selectedVariant]}
                onChange={([variant]) => handleVariantChange(variant)}
                choices={variants.map((variant) => ({
                  value: variant.variant,
                  label: t(`variantLabels.${variant.variant}`),
                  helpText: (
                    <span dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}>
                      {templateOpeningLine(variant.preview, sample)}
                    </span>
                  ),
                }))}
              />
            </BlockStack>
          </Card>
        </BlockStack>
      </Layout.Section>

      <Layout.Section variant="oneThird">
        <MessagePreviewCard
          language={previewLanguage}
          onLanguageChange={setPreviewLanguage}
          template={template}
          storeName={values.storeName}
          currency={data.state.shippingCurrency}
          testSendPhone={data.state.merchantWhatsappPhone ?? null}
          testSendLanguage={data.state.testSendLanguage ?? previewLanguage}
          canSendTest={!readOnly}
          isDirty={model.isDirty}
          isSendingTest={model.isSendingTest}
          onSendTest={() => void model.sendTest()}
        />
      </Layout.Section>
    </Layout>
  )
}
