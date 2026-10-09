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
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
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
import { templateStyleLabel } from '@/features/settings/domain/templateStyleLabel'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { useTestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
import { formatPlanPrice } from '@/shared/lib/money'
import { MessagePreviewCard } from './MessagePreviewCard'

/** Choice values that are not a template style. */
const AUTO_STYLE = 'auto'
const SAME_AS_FIRST = '__same_as_first__'

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
  const phonePrompt = useTestPhonePrompt({
    savedPhone: data.state.merchantWhatsappPhone ?? null,
    shopPhone: data.state.shopPhone ?? null,
    sendTest: model.sendTest,
    saveTestPhone: model.saveTestPhone,
  })
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
  const message =
    selectedDefinition?.message ?? data.template.messages[previewLanguage]
  // Arabic `auto` and the reminder are offered only while the backend says so.
  const offersAuto =
    previewLanguage === 'ar' && values.codTemplateArAuto !== undefined
  const isAuto = offersAuto && values.codTemplateArAuto === true
  const reminderVariants = data.template.reminder?.variants[previewLanguage]
  const selectedReminder = values.codReminderVariants?.[previewLanguage] ?? null

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
    if (variant === AUTO_STYLE) {
      model.update({ codTemplateArAuto: true })
      return
    }
    model.update({
      codTemplateVariants: {
        ...values.codTemplateVariants,
        [previewLanguage]: variant,
      },
      ...(offersAuto ? { codTemplateArAuto: false } : {}),
    })
  }

  const handleReminderChange = (variant: string) => {
    if (!values.codReminderVariants) return
    model.update({
      codReminderVariants: {
        ...values.codReminderVariants,
        [previewLanguage]: variant === SAME_AS_FIRST ? null : variant,
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
              <Text as="h2" variant="headingMd">
                {t('styleHeading')}
              </Text>
              <ChoiceList
                title={t('styleHeading')}
                titleHidden
                disabled={readOnly}
                selected={[isAuto ? AUTO_STYLE : selectedVariant]}
                onChange={([variant]) => handleVariantChange(variant)}
                choices={[
                  ...(offersAuto
                    ? [
                        {
                          value: AUTO_STYLE,
                          label: templateStyleLabel(t, AUTO_STYLE),
                        },
                      ]
                    : []),
                  ...variants.map((variant) => ({
                    value: variant.variant,
                    label: templateStyleLabel(t, variant.variant),
                  })),
                ]}
              />
            </BlockStack>
          </Card>

          {reminderVariants && (
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    {t('reminderHeading')}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t('reminderHint', {
                      language: t(`languageNames.${previewLanguage}`),
                    })}
                  </Text>
                </BlockStack>
                <ChoiceList
                  title={t('reminderHeading')}
                  titleHidden
                  disabled={readOnly}
                  selected={[selectedReminder ?? SAME_AS_FIRST]}
                  onChange={([variant]) => handleReminderChange(variant)}
                  choices={[
                    {
                      value: SAME_AS_FIRST,
                      label: t('reminderSame'),
                    },
                    ...reminderVariants.map((variant) => ({
                      value: variant.variant,
                      label: templateStyleLabel(t, variant.variant),
                      helpText: (
                        <span dir={variant.message.direction}>
                          {templateOpeningLine(variant.message, sample)}
                        </span>
                      ),
                    })),
                  ]}
                />
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Layout.Section>

      <Layout.Section variant="oneThird">
        <MessagePreviewCard
          language={previewLanguage}
          onLanguageChange={setPreviewLanguage}
          message={message}
          note={isAuto ? t('autoStylePreviewNote') : undefined}
          storeName={values.storeName}
          currency={data.state.shippingCurrency}
          testSendPhone={data.state.merchantWhatsappPhone ?? null}
          testSendLanguage={data.state.testSendLanguage ?? previewLanguage}
          canSendTest={!readOnly}
          isDirty={model.isDirty}
          isSendingTest={model.isSendingTest}
          phonePrompt={phonePrompt}
        />
      </Layout.Section>
    </Layout>
  )
}
