'use client'

import { useCallback, useEffect, useMemo, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  getPersistedLocalePreference,
  getLocaleFromPathname,
  isSupportedLocale,
  persistLocalePreference,
  type SupportedLocale,
} from '@/shared/lib/locale'

function buildLocalizedPathname(
  pathname: string,
  targetLocale: SupportedLocale
): string {
  const normalizedPathname =
    pathname.length > 0
      ? pathname.startsWith('/')
        ? pathname
        : `/${pathname}`
      : '/'

  const segments = normalizedPathname.split('/')

  if (segments.length <= 1) {
    return `/${targetLocale}`
  }

  if (isSupportedLocale(segments[1])) {
    segments[1] = targetLocale
    return segments.join('/') || `/${targetLocale}`
  }

  return `/${targetLocale}${normalizedPathname}`
}

export function EmbeddedLanguageSelector() {
  const t = useTranslations('settings')
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const locale = getLocaleFromPathname(pathname)
  const hasSyncedPersistedLocaleRef = useRef(false)

  const search = useMemo(() => {
    const serialized = searchParams.toString()
    return serialized ? `?${serialized}` : ''
  }, [searchParams])

  const handleLocaleChange = useCallback(
    (nextLocale: string) => {
      if (!isSupportedLocale(nextLocale) || nextLocale === locale) {
        return
      }

      persistLocalePreference(nextLocale)

      const localizedPathname = buildLocalizedPathname(pathname, nextLocale)
      const destination = `${localizedPathname}${search}`

      startTransition(() => {
        router.replace(destination)
      })
    },
    [locale, pathname, router, search]
  )

  useEffect(() => {
    if (hasSyncedPersistedLocaleRef.current) return

    const persistedLocale = getPersistedLocalePreference()
    if (!persistedLocale) {
      persistLocalePreference(locale)
      hasSyncedPersistedLocaleRef.current = true
      return
    }

    if (persistedLocale === locale) {
      hasSyncedPersistedLocaleRef.current = true
      return
    }

    hasSyncedPersistedLocaleRef.current = true
    handleLocaleChange(persistedLocale)
  }, [handleLocaleChange, locale])

  const nextLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
  const switchActionLabel = isPending
    ? t('languageSwitching')
    : nextLocale === 'en'
      ? t('switchToEnglish')
      : t('switchToArabic')

  return (
    <ui-title-bar title="Akeed">
      <button
        type="button"
        onClick={() => handleLocaleChange(nextLocale)}
        disabled={isPending}
      >
        {switchActionLabel}
      </button>
    </ui-title-bar>
  )
}
