/**
 * Locale utilities for consistent locale handling across the application
 */

export const SUPPORTED_LOCALES = ['ar', 'en', 'ur', 'es'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'ar'

export type LocaleDirection = 'rtl' | 'ltr'

interface LocaleDefinition {
  direction: LocaleDirection
  /** The regional tag `Intl` formats dates and numbers with. */
  intlTag: string
  /**
   * The tag the money, count and date helpers format with. It is the bare
   * language code, except where the bare code carries another region's
   * conventions: plain `es` writes `1250,50 EGP` and `14:58` as Spain does.
   */
  formatLocale: string
  /** The language's own name, shown in every language switcher as is. */
  nativeName: string
  openGraphLocale: string
}

/**
 * Everything the app knows about an interface language. Adding a language is
 * an entry here plus its `public/messages/<locale>.json`; nothing else should
 * compare a locale to a literal. The interface language is separate from the
 * language of the customer's WhatsApp message.
 */
const LOCALE_DEFINITIONS: Record<SupportedLocale, LocaleDefinition> = {
  ar: {
    direction: 'rtl',
    intlTag: 'ar-EG',
    formatLocale: 'ar',
    nativeName: 'العربية',
    openGraphLocale: 'ar_AR',
  },
  en: {
    direction: 'ltr',
    intlTag: 'en-US',
    formatLocale: 'en',
    nativeName: 'English',
    openGraphLocale: 'en_US',
  },
  ur: {
    direction: 'rtl',
    intlTag: 'ur-PK',
    formatLocale: 'ur',
    nativeName: 'اردو',
    openGraphLocale: 'ur_PK',
  },
  es: {
    direction: 'ltr',
    intlTag: 'es-419',
    formatLocale: 'es-419',
    nativeName: 'Español',
    openGraphLocale: 'es_LA',
  },
}

/** A locale the app serves; anything else reads as the default. */
export function resolveSupportedLocale(locale: string): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
}

export function getLocaleDirection(locale: string): LocaleDirection {
  return LOCALE_DEFINITIONS[resolveSupportedLocale(locale)].direction
}

export function isRtlLocale(locale: string): boolean {
  return getLocaleDirection(locale) === 'rtl'
}

/** `ar-EG`, `en-US`, `ur-PK` or `es-419`, for `Intl` formatters. */
export function getIntlLocale(locale: string): string {
  return LOCALE_DEFINITIONS[resolveSupportedLocale(locale)].intlTag
}

/**
 * The tag for helpers that build their own format, often with `-u-nu-latn`
 * appended: `ar`, `en`, `ur` or `es-419`.
 */
export function getFormatLocale(locale: string): string {
  return LOCALE_DEFINITIONS[resolveSupportedLocale(locale)].formatLocale
}

export function getLocaleNativeName(locale: SupportedLocale): string {
  return LOCALE_DEFINITIONS[locale].nativeName
}

export function getOpenGraphLocaleTag(locale: SupportedLocale): string {
  return LOCALE_DEFINITIONS[locale].openGraphLocale
}

/** The same path in another language: `/ar/billing` to `/ur/billing`. */
export function replacePathnameLocale(
  pathname: string,
  targetLocale: SupportedLocale
): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  const segments = normalized.split('/')
  if (isSupportedLocale(segments[1] ?? '')) {
    segments[1] = targetLocale
    return segments.join('/')
  }
  return normalized === '/'
    ? `/${targetLocale}`
    : `/${targetLocale}${normalized}`
}
export const LOCALE_PREFERENCE_STORAGE_KEY = 'akeed:preferred-locale'
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/**
 * Type guard to check if a string is a valid locale
 */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

/**
 * Persist user locale preference for client-side reuse and middleware locale detection.
 */
export function persistLocalePreference(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, locale)
  } catch {
    // Ignore localStorage failures (private mode, blocked storage, etc.)
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

/**
 * Read a persisted locale preference from localStorage first, then cookie fallback.
 */
export function getPersistedLocalePreference(): SupportedLocale | null {
  if (typeof window === 'undefined') return null

  try {
    const storedLocale = localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)
    if (storedLocale && isSupportedLocale(storedLocale)) {
      return storedLocale
    }
  } catch {
    // Ignore localStorage failures (private mode, blocked storage, etc.)
  }

  const cookieEntry = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE_NAME}=`))

  if (!cookieEntry) return null

  const cookieValue = decodeURIComponent(
    cookieEntry.split('=').slice(1).join('=')
  )
  return isSupportedLocale(cookieValue) ? cookieValue : null
}

/**
 * Normalize a path to ensure it starts with '/'
 */
export function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Extract locale from a pathname or return the default
 */
export function getLocaleFromPathname(pathname: string): SupportedLocale {
  const [, maybeLocale] = pathname.split('/')
  if (isSupportedLocale(maybeLocale)) {
    return maybeLocale
  }
  return DEFAULT_LOCALE
}

/**
 * Check whether a pathname already contains a locale prefix
 */
export function isLocalizedPathname(pathname: string): boolean {
  const [, maybeLocale] = pathname.split('/')
  return isSupportedLocale(maybeLocale)
}

/**
 * Apply locale prefix to a path
 * Works in both server and client contexts
 */
export function withLocale(path: string, locale?: string): string {
  const normalized = normalizePath(path)

  // Don't modify external URLs
  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  // Use provided locale if valid
  const safeLocale = isSupportedLocale(locale ?? '')
    ? (locale as SupportedLocale)
    : undefined

  if (safeLocale) {
    const url = new URL(normalized, 'http://localhost')
    if (isLocalizedPathname(url.pathname)) {
      return `${url.pathname}${url.search}${url.hash}`
    }
    return `/${safeLocale}${url.pathname}${url.search}${url.hash}`
  }

  // Server-side: return path as-is since we can't infer locale
  if (typeof window === 'undefined') {
    return normalized
  }

  // Client-side: infer locale from current pathname
  const url = new URL(normalized, window.location.origin)
  if (isLocalizedPathname(url.pathname)) {
    return `${url.pathname}${url.search}${url.hash}`
  }

  const inferredLocale = getLocaleFromPathname(window.location.pathname)
  return `/${inferredLocale}${url.pathname}${url.search}${url.hash}`
}

/**
 * Auth route paths (without locale prefix)
 */
export const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
] as const

/**
 * Check if a pathname (with locale) matches an auth route
 */
export function isAuthRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const withoutLocale = '/' + pathname.split('/').slice(2).join('/')
  return AUTH_ROUTES.some((route) => withoutLocale.startsWith(route))
}

/**
 * Public route paths (without locale prefix) — accessible without auth,
 * rendered with the marketing Header instead of the authenticated layout.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/support',
  '/docs',
] as const

/**
 * Check if a pathname (with locale) matches a public marketing route
 */
export function isPublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const withoutLocale = '/' + pathname.split('/').slice(2).join('/')
  return PUBLIC_ROUTES.some((route) => {
    if (route === '/') {
      return withoutLocale === '/'
    }

    return withoutLocale === route || withoutLocale.startsWith(`${route}/`)
  })
}
