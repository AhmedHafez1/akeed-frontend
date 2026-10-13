import {
  getIntlLocale,
  getLocaleDirection,
  type LocaleDirection,
} from '@/shared/lib/locale'

/**
 * The languages a customer's WhatsApp message can be written in. This is not
 * the interface language: a merchant can read Akeed in French and message
 * customers in Arabic. The backend decides which of these a store may use
 * (`template.liveLanguages`); this list only says how to show each one.
 */
export const MESSAGE_LANGUAGES = ['ar', 'en', 'ur', 'es', 'fr'] as const

export type MessageLanguage = (typeof MESSAGE_LANGUAGES)[number]

export function isMessageLanguage(value: unknown): value is MessageLanguage {
  return (MESSAGE_LANGUAGES as readonly unknown[]).includes(value)
}

/** The direction of the message text, whatever the page's direction is. */
export function getMessageLanguageDirection(
  language: MessageLanguage
): LocaleDirection {
  return getLocaleDirection(language)
}

/** The `Intl` tag for dates and numbers shown inside a message preview. */
export function getMessageLanguageIntlTag(language: MessageLanguage): string {
  return getIntlLocale(language)
}

/** The customer a preview is addressed to, in the message's own language. */
export const MESSAGE_SAMPLE_CUSTOMER_NAMES: Record<MessageLanguage, string> = {
  ar: 'أحمد',
  en: 'Ahmed',
  ur: 'احمد',
  es: 'Carlos',
  fr: 'Camille',
}

/** The time under a preview bubble, as a phone in that language shows it. */
const MESSAGE_PREVIEW_TIMESTAMPS: Record<MessageLanguage, string> = {
  ar: '8:08 ص',
  en: '8:08 AM',
  ur: '8:08 AM',
  es: '8:08 a. m.',
  fr: '08:08',
}

export function getMessagePreviewTimestamp(language: MessageLanguage): string {
  return MESSAGE_PREVIEW_TIMESTAMPS[language]
}
