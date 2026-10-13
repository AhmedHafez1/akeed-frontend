'use client'

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
import {
  ALWAYS_LANGUAGE_KEYS,
  STYLE_LOCK_KEYS,
  useMessageStyles,
} from '@/features/settings/domain/useMessageStyles'
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

export function MessageTab({ model, data, readOnly }: MessageTabProps) {
  const t = useTranslations('settings.embedded.message')
  const values = model.values
  const styles = useMessageStyles({ data, values, update: model.update })
  const phonePrompt = useTestPhonePrompt({
    savedPhone: data.state.merchantWhatsappPhone ?? null,
    shopPhone: data.state.shopPhone ?? null,
    sendTest: model.sendTest,
    saveTestPhone: model.saveTestPhone,
  })
  if (!values || !styles) return null
  const {
    previewLanguage,
    variants,
    selectedVariant,
    message,
    offersAuto,
    isAuto,
    reminderVariants,
    selectedReminder,
  } = styles
  const previewLanguageName = t(`languageNames.${previewLanguage}`)

  const storeName = values.storeName.trim() || 'Akeed Store'
  const sample = {
    customer: PREVIEW_CUSTOMER_NAMES[previewLanguage],
    store: storeName,
    order: PREVIEW_ORDER_NUMBER,
    total: formatPlanPrice(PREVIEW_TOTAL_AMOUNT, data.state.shippingCurrency),
  }

  const storeNameError =
    model.errors.storeName === 'required'
      ? t('storeNameRequired')
      : model.errors.storeName === 'tooLong'
        ? t('storeNameTooLong', { max: STORE_NAME_MAX_LENGTH })
        : undefined

  const handleVariantChange = (variant: string) => {
    if (variant === AUTO_STYLE) styles.chooseAuto()
    else styles.chooseVariant(variant)
  }

  const handleReminderChange = (variant: string) =>
    styles.chooseReminder(variant === SAME_AS_FIRST ? null : variant)

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
                  styles.chooseLanguage(
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
                  ...styles.languages.map(({ language, isLive }) => {
                    // A store already on the language keeps its choice.
                    const locked =
                      !isLive && values.defaultLanguage !== language
                    return {
                      value: language,
                      disabled: locked,
                      label: locked ? (
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="span">
                            {t(ALWAYS_LANGUAGE_KEYS[language])}
                          </Text>
                          <Badge>{t('notEnabledYet')}</Badge>
                        </InlineStack>
                      ) : (
                        t(ALWAYS_LANGUAGE_KEYS[language])
                      ),
                    }
                  }),
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
                  {t('styleHint', { language: previewLanguageName })}
                </Text>
              </BlockStack>
              {!styles.isLive && (
                <Text as="p" tone="subdued">
                  {t(
                    variants.length > 0 ? 'languageLockedNote' : 'stylesEmpty',
                    { language: previewLanguageName }
                  )}
                </Text>
              )}
              {(variants.length > 0 || offersAuto) && (
                <ChoiceList
                  title={t('styleHeading')}
                  titleHidden
                  disabled={readOnly}
                  selected={
                    isAuto
                      ? [AUTO_STYLE]
                      : selectedVariant
                        ? [selectedVariant]
                        : []
                  }
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
                    ...variants.map((variant) => {
                      const lock = variant.availability
                      const label = templateStyleLabel(
                        t,
                        variant.variant,
                        previewLanguage
                      )
                      if (!lock) return { value: variant.variant, label }
                      return {
                        value: variant.variant,
                        disabled: true,
                        label: (
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="span">{label}</Text>
                            <Badge>{t(STYLE_LOCK_KEYS[lock])}</Badge>
                          </InlineStack>
                        ),
                        // A locked style cannot be picked to preview it, so
                        // its opening line is shown under it.
                        helpText: (
                          <span
                            dir={variant.message.direction}
                            lang={previewLanguage}
                          >
                            {templateOpeningLine(variant.message, sample)}
                          </span>
                        ),
                      }
                    }),
                  ]}
                />
              )}
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
                    {t('reminderHint', { language: previewLanguageName })}
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
                      label: templateStyleLabel(
                        t,
                        variant.variant,
                        previewLanguage
                      ),
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
          languages={styles.languages.map(({ language }) => language)}
          onLanguageChange={styles.setPreviewLanguage}
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
