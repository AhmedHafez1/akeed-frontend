'use client'

import { useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  PREVIEW_TOTAL_AMOUNT,
  templateOpeningLine,
  type PreviewSample,
} from '@/features/settings/domain/messagePreview'
import {
  SETTINGS_FIELD_ID,
  STORE_NAME_MAX_LENGTH,
} from '@/features/settings/domain/settingsForm'
import { templateStyleLabel } from '@/features/settings/domain/templateStyleLabel'
import type { StandaloneSettingsModel } from '@/features/settings/domain/useStandaloneSettings'
import { useTestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
import { formatAmount } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { AkChoiceCard, AkChoiceGroup, akCard, akPill } from '@/shared/ui'
import { MessagePreviewPanel } from './MessagePreviewPanel'
import { TestPhoneDialog } from './TestPhoneDialog'

interface MessageTabProps {
  model: StandaloneSettingsModel
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

function SettingsCard({
  headingId,
  heading,
  description,
  children,
}: {
  headingId: string
  heading: string
  description: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn(akCard, 'space-y-4 px-4 py-4 sm:px-6 sm:py-5')}
    >
      <div>
        <h2 id={headingId} className="text-ak-section text-ink">
          {heading}
        </h2>
        <p className="text-ak-caption text-ink-muted mt-0.5">{description}</p>
      </div>
      {children}
    </section>
  )
}

/**
 * What the confirmation message says: the store name on it, the language it
 * goes out in, and the wording style per language, beside a live preview.
 * Each language keeps its own style, so the style card follows the preview
 * language.
 */
export function MessageTab({ model, data, readOnly }: MessageTabProps) {
  const t = useTranslations('settings.standalone.page.message')
  const tShared = useTranslations('settings.embedded.message')
  const identityId = useId()
  const languageId = useId()
  const styleId = useId()
  const storeNameNoteId = useId()
  const [previewLanguage, setPreviewLanguage] = useState<'ar' | 'en'>(() =>
    initialPreviewLanguage(data)
  )
  const phonePrompt = useTestPhonePrompt({
    savedPhone: data.state.merchantWhatsappPhone ?? null,
    shopPhone: data.state.shopPhone ?? null,
    sendTest: model.sendTest,
    saveTestPhone: model.saveTestPhone,
  })
  const values = model.values
  if (!values) return null

  const storeName = values.storeName.trim() || 'Akeed Store'
  const sample: PreviewSample = {
    customer: PREVIEW_CUSTOMER_NAMES[previewLanguage],
    store: storeName,
    order: PREVIEW_ORDER_NUMBER,
    total: formatAmount(
      PREVIEW_TOTAL_AMOUNT,
      data.state.shippingCurrency,
      previewLanguage
    ),
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
      ? tShared('storeNameRequired')
      : model.errors.storeName === 'tooLong'
        ? tShared('storeNameTooLong', { max: STORE_NAME_MAX_LENGTH })
        : null

  const languageChoices: Array<{
    value: IntegrationOnboardingLanguage
    label: string
    help?: string
    recommended?: boolean
  }> = [
    {
      value: 'auto',
      label: tShared('languageAuto'),
      help: tShared('languageAutoHelp'),
      recommended: true,
    },
    { value: 'ar', label: t('languageArabic') },
    { value: 'en', label: t('languageEnglish') },
  ]

  const handleLanguageChange = (language: IntegrationOnboardingLanguage) => {
    model.update({ defaultLanguage: language })
    if (language !== 'auto') setPreviewLanguage(language)
  }

  const handleVariantChange = (variant: string) => {
    model.update({
      codTemplateVariants: {
        ...values.codTemplateVariants,
        [previewLanguage]: variant,
      },
    })
  }

  return (
    <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <SettingsCard
          headingId={identityId}
          heading={tShared('identityHeading')}
          description={t('identityDesc')}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={SETTINGS_FIELD_ID.storeName}
              className="text-ak-caption text-ink font-semibold"
            >
              {tShared('storeNameLabel')}{' '}
              <span aria-hidden="true" className="text-ak-danger">
                *
              </span>
            </label>
            <input
              id={SETTINGS_FIELD_ID.storeName}
              type="text"
              value={values.storeName}
              onChange={(event) =>
                model.update({ storeName: event.target.value })
              }
              maxLength={STORE_NAME_MAX_LENGTH}
              autoComplete="organization"
              required
              disabled={readOnly}
              aria-invalid={storeNameError ? true : undefined}
              aria-describedby={storeNameNoteId}
              className={cn(
                'ak-focus bg-surface-raised text-ink text-ak-body rounded-ak-control h-10 w-full border px-3 disabled:cursor-not-allowed disabled:opacity-60',
                storeNameError ? 'border-ak-warning' : 'border-control-border'
              )}
            />
            {storeNameError ? (
              <p
                id={storeNameNoteId}
                role="alert"
                className="text-ak-caption text-ak-warning font-semibold"
              >
                {storeNameError}
              </p>
            ) : (
              <p
                id={storeNameNoteId}
                className="text-ak-caption text-ink-muted"
              >
                {t('storeNameHelp', { name: storeName })}
              </p>
            )}
          </div>
        </SettingsCard>

        <SettingsCard
          headingId={languageId}
          heading={tShared('languageHeading')}
          description={t('languageDesc')}
        >
          <AkChoiceGroup aria-labelledby={languageId}>
            {languageChoices.map((choice) => (
              <AkChoiceCard
                key={choice.value}
                checked={values.defaultLanguage === choice.value}
                onSelect={() => handleLanguageChange(choice.value)}
                disabled={readOnly}
                title={choice.label}
                badge={
                  choice.recommended && (
                    <span className={akPill({ tone: 'brand' })}>
                      {tShared('recommended')}
                    </span>
                  )
                }
                description={choice.help}
              />
            ))}
          </AkChoiceGroup>
        </SettingsCard>

        <SettingsCard
          headingId={styleId}
          heading={tShared('styleHeading')}
          description={t('styleHint', {
            language: tShared(`languageNames.${previewLanguage}`),
          })}
        >
          <AkChoiceGroup columns={2} aria-labelledby={styleId}>
            {variants.map((variant) => (
              <AkChoiceCard
                key={variant.variant}
                checked={variant.variant === selectedVariant}
                onSelect={() => handleVariantChange(variant.variant)}
                disabled={readOnly}
                title={templateStyleLabel(tShared, variant.variant)}
                badge={
                  data.template.defaults[previewLanguage] ===
                    variant.variant && (
                    <span className={akPill({ tone: 'neutral' })}>
                      {t('defaultBadge')}
                    </span>
                  )
                }
                description={templateOpeningLine(variant.preview, sample)}
                descriptionDir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
                descriptionLang={previewLanguage}
              />
            ))}
          </AkChoiceGroup>
        </SettingsCard>
      </div>

      <MessagePreviewPanel
        language={previewLanguage}
        onLanguageChange={setPreviewLanguage}
        template={template}
        sample={sample}
        testSendPhone={data.state.merchantWhatsappPhone ?? null}
        testSendLanguage={data.state.testSendLanguage ?? previewLanguage}
        canSendTest={!readOnly}
        isDirty={model.isDirty}
        isSendingTest={model.isSendingTest}
        onSendTest={() => void phonePrompt.requestSend()}
        onChangePhone={phonePrompt.openToChange}
      />
      <TestPhoneDialog prompt={phonePrompt} />
    </div>
  )
}
