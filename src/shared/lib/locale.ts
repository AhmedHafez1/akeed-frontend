/**
 * Locale utilities for consistent locale handling across the application
 */

export const SUPPORTED_LOCALES = ['ar', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'ar'
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
export const AUTH_ROUTES = ['/login', '/signup', '/onboarding'] as const

/**
 * Check if a pathname (with locale) matches an auth route
 */
export function isAuthRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const withoutLocale = '/' + pathname.split('/').slice(2).join('/')
  return AUTH_ROUTES.some((route) => withoutLocale.startsWith(route))
}
