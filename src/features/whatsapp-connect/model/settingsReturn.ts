import type { SupportedLocale } from '@/shared/lib/locale'

const KEY = 'akeed:whatsapp-settings-return'

/** Only a public settings destination survives the Meta redirect, never credentials. */
function settingsUrl(value: unknown, locale: SupportedLocale): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    const secure =
      url.protocol === 'https:' ||
      (url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname))
    const standalone = url.pathname === '/' + locale + '/settings'
    const shopify =
      /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(url.hostname) &&
      new RegExp('^/admin/apps/[^/]+/' + locale + '/settings$').test(
        url.pathname
      )
    if (!secure || url.username || url.password || (!standalone && !shopify))
      return null
    url.search = '?tab=whatsapp'
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function forgetSettingsReturn(): void {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}

export function rememberSettingsReturn(
  value: unknown,
  expiresAt: string,
  locale: SupportedLocale
): string | null {
  const url = settingsUrl(value, locale)
  if (!url) return null
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ url, expiresAt, locale })
    )
  } catch {
    /* Navigation still works in this page. */
  }
  return url
}

export function readSettingsReturn(locale: SupportedLocale): string | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const saved: unknown = JSON.parse(raw)
    if (
      !saved ||
      typeof saved !== 'object' ||
      !('url' in saved) ||
      !('expiresAt' in saved) ||
      typeof saved.expiresAt !== 'string' ||
      !('locale' in saved) ||
      saved.locale !== locale ||
      !(Date.parse(saved.expiresAt) > Date.now())
    )
      return null
    return settingsUrl(saved.url, locale)
  } catch {
    return null
  }
}
