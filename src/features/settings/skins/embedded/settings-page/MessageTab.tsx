'use client'

import {
  Badge,
  BlockStack,
  Card,
  ChoiceList,
  Divider,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  previewTotal,
  templateOpeningLine,
} from '@/features/settings/domain/messagePreview'
import {
  SETTINGS_FIELD_ID,
  STORE_NAME_MAX_LENGTH,
} from '@/features/settings/domain/settingsForm'
import { templateStyleLabel } from '@/features/settings/domain/templateStyleLabel'
import {
  STYLE_LOCK_KEYS,
  useMessageStyles,
} from '@/features/settings/domain/useMessageStyles'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { useTestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
import { useMerchantLogo } from '@/features/settings/domain/useMerchantLogo'
import { LogoCard } from './LogoCard'
import { MessagePreviewCard } from './MessagePreviewCard'

/** Choice values that are not a template style. */
const AUTO_STYLE = 'auto'
const SAME_AS_FIRST = '__same_as_first__'
/** The language choices: by the customer's number, or one for everyone. */
const AUTO_LANGUAGE = 'auto'
const FIXED_LANGUAGE = '__fixed_language__'

interface MessageTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

export function MessageTab({ model, data, readOnly }: MessageTabProps) {
  const t = useTranslations('settings.embedded.message')
  const tLogo = useTranslations('settings.logo')
  const logo = useMerchantLogo(data.branding)
  const values = model.values
  const styles = useMessageStyles({ data, values, update: model.update })
  const phonePrompt = useTestPhonePrompt({
    savedPhone: data.state.merchantWhatsappPhone ?? null,
    shopPhone: data.state.shopPhone ?? null,
    // The test is the message on the phone: it goes out in that language.
    sendTest: () => model.sendTest(styles?.previewLanguage),
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
    total: previewTotal(data.state.shippingCurrency, previewLanguage),
  }
  const styleIds = variants.map((variant) => variant.variant)
  const shownStyle = isAuto ? AUTO_STYLE : (selectedVariant ?? styleIds[0])
  const previewingLabel = shownStyle
    ? t('previewingLabel', {
        language: previewLanguageName,
        style: templateStyleLabel(t, shownStyle, previewLanguage, styleIds),
      })
    : t('previewingLanguage', { language: previewLanguageName })
  const reminderIds = reminderVariants?.map((variant) => variant.variant)
  const isAutoLanguage = values.defaultLanguage === AUTO_LANGUAGE
  // On automatic, the style cards edit the language being previewed.
  const languageHint = styles.canChoosePreviewLanguage
    ? t('styleForLanguage', { language: previewLanguageName })
    : undefined

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

  const handleLanguageModeChange = (mode: string) => {
    if (mode === AUTO_LANGUAGE) styles.chooseLanguage(AUTO_LANGUAGE)
    else if (isAutoLanguage) styles.chooseFixedLanguage()
  }

  return (
    <InlineGrid columns={{ xs: 1, md: ['twoThirds', 'oneThird'] }} gap="400">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
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
            <Divider />
            <ChoiceList
              title={t('languageHeading')}
              disabled={readOnly}
              selected={[isAutoLanguage ? AUTO_LANGUAGE : FIXED_LANGUAGE]}
              onChange={([mode]) => handleLanguageModeChange(mode)}
              choices={[
                {
                  value: AUTO_LANGUAGE,
                  label: (
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span">{t('languageAuto')}</Text>
                      <Badge tone="success">{t('recommended')}</Badge>
                    </InlineStack>
                  ),
                  helpText: t('languageAutoHelp'),
                },
                {
                  value: FIXED_LANGUAGE,
                  label: t('languageFixed'),
                  helpText: t('languageFixedHelp'),
                  renderChildren: (isSelected) =>
                    isSelected && (
                      <Select
                        label={t('languageFixedLabel')}
                        labelHidden
                        disabled={readOnly}
                        value={values.defaultLanguage}
                        onChange={(language) =>
                          styles.chooseLanguage(
                            language as IntegrationOnboardingLanguage
                          )
                        }
                        options={styles.languages.map(
                          ({ language, isLive }) => {
                            // A store already on the language keeps its choice.
                            const locked =
                              !isLive && values.defaultLanguage !== language
                            const name = t(`languageNames.${language}`)
                            return {
                              value: language,
                              disabled: locked,
                              label: locked
                                ? t('languageOptionLocked', {
                                    language: name,
                                    status: t('notEnabledYet'),
                                  })
                                : name,
                            }
                          }
                        )}
                      />
                    ),
                },
              ]}
            />
          </BlockStack>
        </Card>

        {logo.isAvailable && <LogoCard logo={logo} readOnly={readOnly} />}

        <Card>
          <BlockStack gap="300">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                {t('styleHeading')}
              </Text>
              {languageHint && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {languageHint}
                </Text>
              )}
            </BlockStack>
            {!styles.isLive && (
              <Text as="p" tone="subdued">
                {t(variants.length > 0 ? 'languageLockedNote' : 'stylesEmpty', {
                  language: previewLanguageName,
                })}
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
                      previewLanguage,
                      styleIds
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
            <BlockStack gap="300">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  {t('reminderHeading')}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {languageHint
                    ? `${t('reminderHint')} ${languageHint}`
                    : t('reminderHint')}
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
                      previewLanguage,
                      reminderIds
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

      {/* Stays in view while the settings beside it scroll. */}
      <div>
        <div className="md:sticky md:top-4">
          <MessagePreviewCard
            language={previewLanguage}
            languageChoice={
              styles.canChoosePreviewLanguage
                ? {
                    languages: styles.languages.map(({ language }) => language),
                    onChange: styles.setPreviewLanguage,
                  }
                : undefined
            }
            message={message}
            sample={sample}
            previewingLabel={previewingLabel}
            note={isAuto ? t('autoStylePreviewNote') : undefined}
            testSendPhone={data.state.merchantWhatsappPhone ?? null}
            testSendLanguage={previewLanguage}
            isPreviewLive={styles.isLive}
            canSendTest={!readOnly}
            isDirty={model.isDirty}
            isSendingTest={model.isSendingTest}
            phonePrompt={phonePrompt}
            headerImage={
              logo.isAvailable && logo.branding.bannerUrl
                ? { src: logo.branding.bannerUrl, alt: tLogo('bannerAlt') }
                : undefined
            }
          />
        </div>
      </div>
    </InlineGrid>
  )
}
