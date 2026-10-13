import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALE_PREFERENCE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getFormatLocale,
  getIntlLocale,
  getLocaleDirection,
  getLocaleFromPathname,
  getLocaleNativeName,
  getPersistedLocalePreference,
  isRtlLocale,
  isSupportedLocale,
  persistLocalePreference,
  replacePathnameLocale,
  resolveSupportedLocale,
  withLocale,
} from './locale'

function clearLocaleCookie() {
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
}

describe('interface languages', () => {
  it('serves five languages, with Arabic as the default', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ar', 'en', 'ur', 'es', 'fr'])
    expect(DEFAULT_LOCALE).toBe('ar')
  })

  it.each([
    ['ar', 'rtl', 'ar-EG', 'العربية'],
    ['en', 'ltr', 'en-US', 'English'],
    ['ur', 'rtl', 'ur-PK', 'اردو'],
    ['es', 'ltr', 'es-419', 'Español'],
    ['fr', 'ltr', 'fr-FR', 'Français'],
  ] as const)(
    'describes %s as %s, formatted as %s',
    (locale, direction, tag, name) => {
      expect(getLocaleDirection(locale)).toBe(direction)
      expect(isRtlLocale(locale)).toBe(direction === 'rtl')
      expect(getIntlLocale(locale)).toBe(tag)
      expect(getLocaleNativeName(locale)).toBe(name)
    }
  )

  it.each([
    ['ar', 'ar'],
    ['en', 'en'],
    ['ur', 'ur'],
    ['es', 'es-419'],
    ['fr', 'fr'],
  ] as const)('formats %s amounts and dates as %s', (locale, tag) => {
    expect(getFormatLocale(locale)).toBe(tag)
  })

  it('formats Spanish like Latin America, not like Spain', () => {
    const tag = getFormatLocale('es')
    expect(new Intl.NumberFormat(tag).format(12500.5)).toBe('12,500.5')
    expect(
      new Intl.DateTimeFormat(tag, {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2026, 8, 22)))
    ).toBe('22 de septiembre')
  })

  it('formats French as France does: spaced thousands, decimal comma, 24-hour clock', () => {
    const tag = getFormatLocale('fr')
    const spaces = /\s/g
    expect(
      new Intl.NumberFormat(tag).format(12500.5).replace(spaces, ' ')
    ).toBe('12 500,5')
    expect(
      new Intl.DateTimeFormat(tag, {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2026, 8, 22)))
    ).toBe('22 septembre')
    expect(
      new Intl.DateTimeFormat(tag, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2026, 8, 22, 14, 58)))
    ).toBe('14:58')
  })

  it('reads an unknown language as the default', () => {
    expect(isSupportedLocale('de')).toBe(false)
    expect(resolveSupportedLocale('de')).toBe('ar')
    expect(getLocaleDirection('de')).toBe('rtl')
    expect(getLocaleFromPathname('/de/billing')).toBe('ar')
  })

  it('reads the language from the path', () => {
    expect(getLocaleFromPathname('/ur/dashboard')).toBe('ur')
    expect(withLocale('/billing', 'ur')).toBe('/ur/billing')
    expect(getLocaleFromPathname('/es/dashboard')).toBe('es')
    expect(withLocale('/billing', 'es')).toBe('/es/billing')
    expect(getLocaleFromPathname('/fr/dashboard')).toBe('fr')
    expect(withLocale('/billing', 'fr')).toBe('/fr/billing')
  })
})

describe('replacePathnameLocale', () => {
  it.each([
    ['/ar/billing', 'ur', '/ur/billing'],
    ['/ur/settings/api', 'en', '/en/settings/api'],
    ['/en', 'ur', '/ur'],
    ['/', 'ur', '/ur'],
    ['/billing', 'ur', '/ur/billing'],
    ['/ar/billing', 'es', '/es/billing'],
    ['/es/settings/api', 'ar', '/ar/settings/api'],
    ['/ar/billing', 'fr', '/fr/billing'],
    ['/fr/settings/api', 'ar', '/ar/settings/api'],
  ] as const)('turns %s into %s: %s', (pathname, locale, expected) => {
    expect(replacePathnameLocale(pathname, locale)).toBe(expected)
  })
})

describe('the remembered language', () => {
  beforeEach(() => {
    localStorage.clear()
    clearLocaleCookie()
  })

  it.each(SUPPORTED_LOCALES)('remembers %s and restores it', (locale) => {
    persistLocalePreference(locale)

    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe(locale)
    expect(document.cookie).toContain(`NEXT_LOCALE=${locale}`)
    expect(getPersistedLocalePreference()).toBe(locale)
  })

  it('falls back to the cookie when storage is empty', () => {
    persistLocalePreference('ur')
    localStorage.clear()

    expect(getPersistedLocalePreference()).toBe('ur')
  })

  it('ignores a stored value that is not a language the app serves', () => {
    localStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, 'de')

    expect(getPersistedLocalePreference()).toBeNull()
  })
})
