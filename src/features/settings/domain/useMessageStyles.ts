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
  /**
   * True while the store's language is `auto`: the preview can then show
   * any language. A store set to one language previews that language.
   */
  canChoosePreviewLanguage: boolean
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
  /**
   * Leaves `auto` for one language: the previewed one when the store can use
   * it, else the first it can.
   */
  chooseFixedLanguage: () => void
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
 * the preview language. A store set to one language previews that language;
 * on `auto` the merchant picks which one to look at. Both skins render from
 * this.
 */
export function useMessageStyles({
  data,
  values,
  update,
}: UseMessageStylesParams): MessageStyles | null {
  const [chosenPreviewLanguage, setPreviewLanguage] = useState<MessageLanguage>(
    () => initialPreviewLanguage(data)
  )
  if (!values) return null

  // Read from the form, so a discarded language change leaves the preview
  // with the form and not on a language nothing on screen can change.
  const previewLanguage = isMessageLanguage(values.defaultLanguage)
    ? values.defaultLanguage
    : chosenPreviewLanguage

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
  const languages = messageLanguagesOf(template).map((language) => ({
    language,
    isLive: isLiveMessageLanguage(template, language),
  }))

  return {
    previewLanguage,
    canChoosePreviewLanguage: values.defaultLanguage === 'auto',
    setPreviewLanguage,
    languages,
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
    chooseFixedLanguage: () => {
      const language = isLive
        ? previewLanguage
        : languages.find((choice) => choice.isLive)?.language
      if (!language) return
      update({ defaultLanguage: language })
      setPreviewLanguage(language)
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
