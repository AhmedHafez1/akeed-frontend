'use client'

import { useState } from 'react'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'
import {
  getMessageLanguageDirection,
  isMessageLanguage,
  type MessageLanguage,
} from '@/shared/lib/messageLanguage'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import type {
  CodTemplateDefinition,
  SettingsResponse,
} from '../api/settingsApi'
import type { SettingsFormValues } from './settingsForm'

type TemplateSettings = SettingsResponse['template']

/**
 * The translation key of "Always <language>" for each message language. The
 * same key names exist under `settings.embedded.message` and
 * `settings.standalone.page.message`.
 */
export const ALWAYS_LANGUAGE_KEYS = {
  ar: 'languageArabic',
  en: 'languageEnglish',
  ur: 'languageUrdu',
  es: 'languageSpanish',
  fr: 'languageFrench',
} as const satisfies Record<MessageLanguage, string>

/** The translation key of the pill on a style that cannot be chosen yet. */
export const STYLE_LOCK_KEYS = {
  in_review: 'awaitingApproval',
  not_enabled: 'notEnabledYet',
} as const

/** The message languages the settings response lists, in its order. */
export function messageLanguagesOf(
  template: TemplateSettings
): MessageLanguage[] {
  return template.languages.filter(isMessageLanguage)
}

/**
 * Whether a store can be set to a language. A response without the list
 * comes from a backend that only knows live languages.
 */
export function isLiveMessageLanguage(
  template: TemplateSettings,
  language: MessageLanguage
): boolean {
  return (template.liveLanguages ?? template.languages).includes(language)
}

/** The language the preview opens on. */
export function initialPreviewLanguage(
  data: SettingsResponse
): MessageLanguage {
  const language = data.state.defaultLanguage
  if (isMessageLanguage(language)) return language
  // "auto" follows the customer's number; the merchant's own number is the
  // best guess for where their customers are.
  return data.state.testSendLanguage ?? 'ar'
}

export interface MessageLanguageChoice {
  language: MessageLanguage
  /** False while the language has no approved message: it cannot be chosen. */
  isLive: boolean
}

export interface MessageStyles {
  previewLanguage: MessageLanguage
  setPreviewLanguage: (language: MessageLanguage) => void
  languages: MessageLanguageChoice[]
  /** Whether the preview language can be used by the store. */
  isLive: boolean
  /** The styles of the preview language; locked ones carry `availability`. */
  variants: CodTemplateDefinition[]
  selectedVariant: string | null
  defaultVariant: string | null
  /** What the preview shows. Empty when the language has no message yet. */
  message: TemplateMessage
  /** Arabic style by the customer's country, while the backend offers it. */
  offersAuto: boolean
  isAuto: boolean
  /** Undefined while reminders are not offered for the preview language. */
  reminderVariants: CodTemplateDefinition[] | undefined
  selectedReminder: string | null
  chooseLanguage: (language: IntegrationOnboardingLanguage) => void
  chooseVariant: (variant: string) => void
  chooseAuto: () => void
  chooseReminder: (variant: string | null) => void
}

interface UseMessageStylesParams {
  data: SettingsResponse
  values: SettingsFormValues | null
  update: (patch: Partial<SettingsFormValues>) => void
}

/**
 * What the Message tab shows for the language being previewed, and what its
 * controls change. Each language keeps its own style, so everything follows
 * the preview language. Both skins render from this.
 */
export function useMessageStyles({
  data,
  values,
  update,
}: UseMessageStylesParams): MessageStyles | null {
  const [previewLanguage, setPreviewLanguage] = useState<MessageLanguage>(() =>
    initialPreviewLanguage(data)
  )
  if (!values) return null

  const { template } = data
  const isLive = isLiveMessageLanguage(template, previewLanguage)
  const variants = template.variants[previewLanguage] ?? []
  const selectedVariant = values.codTemplateVariants[previewLanguage] ?? null
  const shown =
    variants.find((variant) => variant.variant === selectedVariant) ??
    variants[0]
  const message: TemplateMessage = shown?.message ??
    template.messages[previewLanguage] ?? {
      lines: [],
      buttons: [],
      direction: getMessageLanguageDirection(previewLanguage),
      source: 'registered',
    }
  const offersAuto =
    previewLanguage === 'ar' && values.codTemplateArAuto !== undefined
  const reminders = values.codReminderVariants

  return {
    previewLanguage,
    setPreviewLanguage,
    languages: messageLanguagesOf(template).map((language) => ({
      language,
      isLive: isLiveMessageLanguage(template, language),
    })),
    isLive,
    variants,
    selectedVariant,
    defaultVariant: template.defaults[previewLanguage] ?? null,
    message,
    offersAuto,
    isAuto: offersAuto && values.codTemplateArAuto === true,
    reminderVariants: isLive
      ? template.reminder?.variants[previewLanguage]
      : undefined,
    selectedReminder: reminders?.[previewLanguage] ?? null,
    chooseLanguage: (language) => {
      update({ defaultLanguage: language })
      if (language !== 'auto') setPreviewLanguage(language)
    },
    chooseVariant: (variant) =>
      update({
        codTemplateVariants: {
          ...values.codTemplateVariants,
          [previewLanguage]: variant,
        },
        ...(offersAuto ? { codTemplateArAuto: false } : {}),
      }),
    chooseAuto: () => update({ codTemplateArAuto: true }),
    chooseReminder: (variant) => {
      if (!reminders) return
      update({
        codReminderVariants: { ...reminders, [previewLanguage]: variant },
      })
    },
  }
}
