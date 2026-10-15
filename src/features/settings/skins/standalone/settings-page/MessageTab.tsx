'use client'

import { useId, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  previewTotal,
  templateOpeningLine,
  type PreviewSample,
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
import { useMerchantLogo } from '@/features/settings/domain/useMerchantLogo'
import type { StandaloneSettingsModel } from '@/features/settings/domain/useStandaloneSettings'
import { useTestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
import { cn } from '@/shared/lib/utils'
import {
  AkChoiceCard,
  AkChoiceGroup,
  AkSelect,
  akCard,
  akPill,
} from '@/shared/ui'
import { LogoCard } from './LogoCard'
import { MessagePreviewPanel } from './MessagePreviewPanel'
import { TestPhoneDialog } from './TestPhoneDialog'

interface MessageTabProps {
  model: StandaloneSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

function SettingsCard({
  headingId,
  heading,
  description,
  children,
}: {
  headingId: string
  heading: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn(akCard, 'space-y-3 px-4 py-4 sm:px-6')}
    >
      <div>
        <h2 id={headingId} className="text-ak-section text-ink">
          {heading}
        </h2>
        {description && (
          <p className="text-ak-caption text-ink-muted mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * What the confirmation message says: the store name on it and the language
 * it goes out in (one card), and the wording style per language, beside a
 * live preview.
 * Each language keeps its own style, so the style card follows the preview
 * language. A language WhatsApp has not approved a message for yet is shown
 * with its messages locked, and cannot be chosen.
 */
export function MessageTab({ model, data, readOnly }: MessageTabProps) {
  const t = useTranslations('settings.standalone.page.message')
  const tShared = useTranslations('settings.embedded.message')
  const tLogo = useTranslations('settings.logo')
  const logo = useMerchantLogo(data.branding)
  const identityId = useId()
  const languageId = useId()
  const fixedLanguageId = useId()
  const styleId = useId()
  const reminderId = useId()
  const storeNameNoteId = useId()
  const styles = useMessageStyles({
    data,
    values: model.values,
    update: model.update,
  })
  const phonePrompt = useTestPhonePrompt({
    savedPhone: data.state.merchantWhatsappPhone ?? null,
    shopPhone: data.state.shopPhone ?? null,
    // The test is the message on the phone: it goes out in that language.
    sendTest: () => model.sendTest(styles?.previewLanguage),
    saveTestPhone: model.saveTestPhone,
  })
  const values = model.values
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
  const previewLanguageName = tShared(`languageNames.${previewLanguage}`)

  const storeName = values.storeName.trim() || 'Akeed Store'
  const sample: PreviewSample = {
    customer: PREVIEW_CUSTOMER_NAMES[previewLanguage],
    store: storeName,
    order: PREVIEW_ORDER_NUMBER,
    total: previewTotal(data.state.shippingCurrency, previewLanguage),
  }
  const styleIds = variants.map((variant) => variant.variant)
  const shownStyle = isAuto ? 'auto' : (selectedVariant ?? styleIds[0])
  const previewingLabel = shownStyle
    ? tShared('previewingLabel', {
        language: previewLanguageName,
        style: templateStyleLabel(
          tShared,
          shownStyle,
          previewLanguage,
          styleIds
        ),
      })
    : tShared('previewingLanguage', { language: previewLanguageName })
  const reminderIds = reminderVariants?.map((variant) => variant.variant)
  const isAutoLanguage = values.defaultLanguage === 'auto'
  // On automatic, the style cards edit the language being previewed.
  const languageHint = styles.canChoosePreviewLanguage
    ? tShared('styleForLanguage', { language: previewLanguageName })
    : undefined

  const storeNameError =
    model.errors.storeName === 'required'
      ? tShared('storeNameRequired')
      : model.errors.storeName === 'tooLong'
        ? tShared('storeNameTooLong', { max: STORE_NAME_MAX_LENGTH })
        : null

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

          <div className="border-line space-y-2 border-t pt-3">
            <div>
              <h3
                id={languageId}
                className="text-ak-caption text-ink font-semibold"
              >
                {tShared('languageHeading')}
              </h3>
              <p className="text-ak-caption text-ink-muted">
                {t('languageDesc')}
              </p>
            </div>
            <AkChoiceGroup columns={2} aria-labelledby={languageId}>
              <AkChoiceCard
                checked={isAutoLanguage}
                onSelect={() => styles.chooseLanguage('auto')}
                disabled={readOnly}
                title={tShared('languageAuto')}
                badge={
                  <span className={akPill({ tone: 'brand' })}>
                    {tShared('recommended')}
                  </span>
                }
                description={tShared('languageAutoHelp')}
              />
              <AkChoiceCard
                checked={!isAutoLanguage}
                onSelect={styles.chooseFixedLanguage}
                disabled={readOnly}
                title={tShared('languageFixed')}
                description={tShared('languageFixedHelp')}
              />
            </AkChoiceGroup>
            {!isAutoLanguage && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <label
                  htmlFor={fixedLanguageId}
                  className="text-ak-caption text-ink font-semibold"
                >
                  {tShared('languageFixedLabel')}
                </label>
                <AkSelect
                  id={fixedLanguageId}
                  className="w-full sm:w-64"
                  value={values.defaultLanguage}
                  disabled={readOnly}
                  onChange={(event) =>
                    styles.chooseLanguage(
                      event.target.value as IntegrationOnboardingLanguage
                    )
                  }
                  options={styles.languages.map(({ language, isLive }) => {
                    // A store already on the language keeps its choice.
                    const locked =
                      !isLive && values.defaultLanguage !== language
                    const name = tShared(`languageNames.${language}`)
                    return {
                      value: language,
                      disabled: locked,
                      label: locked
                        ? tShared('languageOptionLocked', {
                            language: name,
                            status: tShared('notEnabledYet'),
                          })
                        : name,
                    }
                  })}
                />
              </div>
            )}
          </div>
        </SettingsCard>

        {logo.isAvailable && <LogoCard logo={logo} readOnly={readOnly} />}

        <SettingsCard
          headingId={styleId}
          heading={tShared('styleHeading')}
          description={languageHint}
        >
          {!styles.isLive && (
            <p className="text-ak-caption text-ink-muted">
              {tShared(
                variants.length > 0 ? 'languageLockedNote' : 'stylesEmpty',
                { language: previewLanguageName }
              )}
            </p>
          )}
          {(variants.length > 0 || offersAuto) && (
            <AkChoiceGroup columns={2} aria-labelledby={styleId}>
              {offersAuto && (
                <AkChoiceCard
                  checked={isAuto}
                  onSelect={styles.chooseAuto}
                  disabled={readOnly}
                  title={templateStyleLabel(tShared, 'auto')}
                />
              )}
              {variants.map((variant) => {
                const lock = variant.availability
                return (
                  <AkChoiceCard
                    key={variant.variant}
                    checked={
                      !lock && !isAuto && variant.variant === selectedVariant
                    }
                    onSelect={() => styles.chooseVariant(variant.variant)}
                    disabled={readOnly || Boolean(lock)}
                    title={templateStyleLabel(
                      tShared,
                      variant.variant,
                      previewLanguage,
                      styleIds
                    )}
                    badge={
                      lock ? (
                        <span className={akPill({ tone: 'neutral' })}>
                          {tShared(STYLE_LOCK_KEYS[lock])}
                        </span>
                      ) : (
                        styles.defaultVariant === variant.variant && (
                          <span className={akPill({ tone: 'neutral' })}>
                            {t('defaultBadge')}
                          </span>
                        )
                      )
                    }
                    // A locked style cannot be picked to preview it, so its
                    // opening line is shown on the card.
                    description={
                      lock
                        ? templateOpeningLine(variant.message, sample)
                        : undefined
                    }
                    descriptionDir={variant.message.direction}
                    descriptionLang={previewLanguage}
                  />
                )
              })}
            </AkChoiceGroup>
          )}
        </SettingsCard>

        {reminderVariants && (
          <SettingsCard
            headingId={reminderId}
            heading={tShared('reminderHeading')}
            description={
              languageHint
                ? `${tShared('reminderHint')} ${languageHint}`
                : tShared('reminderHint')
            }
          >
            <AkChoiceGroup columns={2} aria-labelledby={reminderId}>
              <AkChoiceCard
                checked={selectedReminder === null}
                onSelect={() => styles.chooseReminder(null)}
                disabled={readOnly}
                title={tShared('reminderSame')}
              />
              {reminderVariants.map((variant) => (
                <AkChoiceCard
                  key={variant.variant}
                  checked={variant.variant === selectedReminder}
                  onSelect={() => styles.chooseReminder(variant.variant)}
                  disabled={readOnly}
                  title={templateStyleLabel(
                    tShared,
                    variant.variant,
                    previewLanguage,
                    reminderIds
                  )}
                  description={templateOpeningLine(variant.message, sample)}
                  descriptionDir={variant.message.direction}
                  descriptionLang={previewLanguage}
                />
              ))}
            </AkChoiceGroup>
          </SettingsCard>
        )}
      </div>

      <MessagePreviewPanel
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
        note={isAuto ? tShared('autoStylePreviewNote') : undefined}
        testSendPhone={data.state.merchantWhatsappPhone ?? null}
        testSendLanguage={previewLanguage}
        isPreviewLive={styles.isLive}
        canSendTest={!readOnly}
        isDirty={model.isDirty}
        isSendingTest={model.isSendingTest}
        onSendTest={() => void phonePrompt.requestSend()}
        onChangePhone={phonePrompt.openToChange}
        headerImage={
          logo.isAvailable && logo.branding.bannerUrl
            ? { src: logo.branding.bannerUrl, alt: tLogo('bannerAlt') }
            : undefined
        }
      />
      <TestPhoneDialog prompt={phonePrompt} />
    </div>
  )
}
