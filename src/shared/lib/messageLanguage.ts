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
export const MESSAGE_LANGUAGES = ['ar', 'en', 'ur', 'es', 'fr', 'tr'] as const

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
  tr: 'Ayşe',
}

/** The time under a preview bubble, as a phone in that language shows it. */
const MESSAGE_PREVIEW_TIMESTAMPS: Record<MessageLanguage, string> = {
  ar: '8:08 ص',
  en: '8:08 AM',
  ur: '8:08 AM',
  es: '8:08 a. m.',
  fr: '08:08',
  tr: '08:08',
}

export function getMessagePreviewTimestamp(language: MessageLanguage): string {
  return MESSAGE_PREVIEW_TIMESTAMPS[language]
}

/**
 * The currency word Arabic readers expect after an amount. A currency not
 * listed here is written with its ISO code.
 */
const ARABIC_CURRENCY_SYMBOLS: Readonly<Record<string, string>> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  USD: '$',
}

const PLAIN_DECIMAL = /^(\d+)(?:\.(\d+))?$/
const ISO_CURRENCY = /^[A-Z]{3}$/

function currencyMinorUnits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}

/**
 * An order total as a sent message writes it, so a preview shows what the
 * customer gets: `1,250.00 ج.م` in Arabic, `EGP 1,250.00` in English and
 * `1,250.00 EUR` in the other languages, Western digits, the currency's minor
 * units always shown. It follows the backend's `formatOrderTotal`; change
 * the two together.
 */
export function formatMessageTotal(
  amount: string | number,
  currency: string | null | undefined,
  language: MessageLanguage
): string {
  const match = PLAIN_DECIMAL.exec(String(amount).trim())
  const code = (currency ?? '').trim().toUpperCase()
  if (!match || (code && !ISO_CURRENCY.test(code))) {
    return `${amount} ${currency ?? ''}`.trim()
  }
  const [, whole, fraction = ''] = match
  const minorUnits = code ? currencyMinorUnits(code) : 2
  let digits = fraction
  while (digits.length > minorUnits && digits.endsWith('0')) {
    digits = digits.slice(0, -1)
  }
  const decimals = digits.padEnd(minorUnits, '0')
  const grouped = whole
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const number = decimals ? `${grouped}.${decimals}` : grouped
  if (!code) return number
  if (language === 'ar') {
    return `${number} ${ARABIC_CURRENCY_SYMBOLS[code] ?? code}`
  }
  return language === 'en' ? `${code} ${number}` : `${number} ${code}`
}
