import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALE_PREFERENCE_STORAGE_KEY,
  SUPPORTED_LOCALES,
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
  it('serves Arabic, English and Urdu, with Arabic as the default', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ar', 'en', 'ur'])
    expect(DEFAULT_LOCALE).toBe('ar')
  })

  it.each([
    ['ar', 'rtl', 'ar-EG', 'العربية'],
    ['en', 'ltr', 'en-US', 'English'],
    ['ur', 'rtl', 'ur-PK', 'اردو'],
  ] as const)(
    'describes %s as %s, formatted as %s',
    (locale, direction, tag, name) => {
      expect(getLocaleDirection(locale)).toBe(direction)
      expect(isRtlLocale(locale)).toBe(direction === 'rtl')
      expect(getIntlLocale(locale)).toBe(tag)
      expect(getLocaleNativeName(locale)).toBe(name)
    }
  )

  it('reads an unknown language as the default', () => {
    expect(isSupportedLocale('fr')).toBe(false)
    expect(resolveSupportedLocale('fr')).toBe('ar')
    expect(getLocaleDirection('fr')).toBe('rtl')
    expect(getLocaleFromPathname('/fr/billing')).toBe('ar')
  })

  it('reads the language from the path', () => {
    expect(getLocaleFromPathname('/ur/dashboard')).toBe('ur')
    expect(withLocale('/billing', 'ur')).toBe('/ur/billing')
  })
})

describe('replacePathnameLocale', () => {
  it.each([
    ['/ar/billing', 'ur', '/ur/billing'],
    ['/ur/settings/api', 'en', '/en/settings/api'],
    ['/en', 'ur', '/ur'],
    ['/', 'ur', '/ur'],
    ['/billing', 'ur', '/ur/billing'],
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
    localStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, 'fr')

    expect(getPersistedLocalePreference()).toBeNull()
  })
})
