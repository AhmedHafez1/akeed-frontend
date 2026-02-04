/**
 * Locale utilities for consistent locale handling across the application
 */

export const SUPPORTED_LOCALES = ['ar', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'ar'

/**
 * Type guard to check if a string is a valid locale
 */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
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
