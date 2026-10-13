'use client'

import { useId, type ReactNode } from 'react'
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
import {
  ALWAYS_LANGUAGE_KEYS,
  STYLE_LOCK_KEYS,
  useMessageStyles,
} from '@/features/settings/domain/useMessageStyles'
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
      className={cn(akCard, 'space-y-4 px-4 py-4 sm:px-6 sm:py-5')}
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
 * What the confirmation message says: the store name on it, the language it
 * goes out in, and the wording style per language, beside a live preview.
 * Each language keeps its own style, so the style card follows the preview
 * language. A language WhatsApp has not approved a message for yet is shown
 * with its messages locked, and cannot be chosen.
 */
export function MessageTab({ model, data, readOnly }: MessageTabProps) {
  const t = useTranslations('settings.standalone.page.message')
  const tShared = useTranslations('settings.embedded.message')
  const identityId = useId()
  const languageId = useId()
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
    sendTest: model.sendTest,
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
    total: formatAmount(
      PREVIEW_TOTAL_AMOUNT,
      data.state.shippingCurrency,
      previewLanguage
    ),
  }

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
    /** No approved message yet: shown, but it cannot be chosen. */
    locked?: boolean
  }> = [
    {
      value: 'auto',
      label: tShared('languageAuto'),
      help: tShared('languageAutoHelp'),
      recommended: true,
    },
    ...styles.languages.map(({ language, isLive }) => ({
      value: language,
      label: t(ALWAYS_LANGUAGE_KEYS[language]),
      // A store already on the language keeps its choice selectable.
      locked: !isLive && values.defaultLanguage !== language,
    })),
  ]

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
          <AkChoiceGroup columns={2} aria-labelledby={languageId}>
            {languageChoices.map((choice) => (
              <AkChoiceCard
                key={choice.value}
                className={
                  choice.value === 'auto' ? 'sm:col-span-2' : undefined
                }
                checked={values.defaultLanguage === choice.value}
                onSelect={() => styles.chooseLanguage(choice.value)}
                disabled={readOnly || choice.locked}
                title={choice.label}
                badge={
                  choice.recommended ? (
                    <span className={akPill({ tone: 'brand' })}>
                      {tShared('recommended')}
                    </span>
                  ) : (
                    choice.locked && (
                      <span className={akPill({ tone: 'neutral' })}>
                        {tShared('notEnabledYet')}
                      </span>
                    )
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
          description={tShared('styleHint', { language: previewLanguageName })}
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
                      previewLanguage
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
            description={tShared('reminderHint', {
              language: previewLanguageName,
            })}
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
                    previewLanguage
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
        languages={styles.languages.map(({ language }) => language)}
        onLanguageChange={styles.setPreviewLanguage}
        message={message}
        sample={sample}
        note={isAuto ? tShared('autoStylePreviewNote') : undefined}
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
