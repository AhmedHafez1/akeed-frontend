import { isSupportedLocale, type SupportedLocale } from '@/shared/lib/locale'

/**
 * What a Track order link opens, as the backend answers it: a redirect to
 * the carrier's page, Akeed's own page in the message's language, or a
 * neutral page for a code that is unknown or too old.
 */
export type ShippingTrackingView =
  | { kind: 'redirect'; url: string }
  | {
      kind: 'page'
      language: SupportedLocale
      storeName: string | null
      orderNumber: string | null
      courier: string | null
      trackingNumber: string | null
    }
  | { kind: 'unavailable' }

/** A code as the backend issues it: 22 to 43 URL-safe characters. */
const CODE_PATTERN = /^[A-Za-z0-9_-]{22,43}$/

export function isTrackingCode(value: string): boolean {
  return CODE_PATTERN.test(value)
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

/** Only an absolute https link is followed; anything else is unavailable. */
function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Reads the backend's answer, refusing any shape it does not recognise. */
export function parseShippingTrackingView(body: unknown): ShippingTrackingView {
  if (typeof body !== 'object' || body === null) return { kind: 'unavailable' }
  const record = body as Record<string, unknown>
  if (record.kind === 'redirect') {
    const url = httpsUrl(record.url)
    return url ? { kind: 'redirect', url } : { kind: 'unavailable' }
  }
  if (record.kind === 'page') {
    const language =
      typeof record.language === 'string' && isSupportedLocale(record.language)
        ? record.language
        : 'ar'
    return {
      kind: 'page',
      language,
      storeName: text(record.storeName),
      orderNumber: text(record.orderNumber),
      courier: text(record.courier),
      trackingNumber: text(record.trackingNumber),
    }
  }
  return { kind: 'unavailable' }
}
