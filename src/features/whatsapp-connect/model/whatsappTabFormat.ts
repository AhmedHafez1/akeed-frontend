import { getIntlLocale, type SupportedLocale } from '@/shared/lib/locale'
import type { AcceptedSend } from '../api/whatsappConnectApi'

/**
 * A WhatsApp message language's name, in the interface language. The
 * customer's message language and the merchant's interface language differ,
 * so the name comes from `Intl` rather than from a locale menu.
 */
export function messageLanguageName(
  code: string,
  locale: SupportedLocale
): string {
  try {
    const names = new Intl.DisplayNames([getIntlLocale(locale)], {
      type: 'language',
    })
    return names.of(code) ?? code
  } catch {
    return code
  }
}

/** When an accepted send happened, as a short date and time. */
export function acceptedAtLabel(
  send: AcceptedSend,
  formatLocale: string
): string {
  return new Intl.DateTimeFormat(formatLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(send.acceptedAt))
}
