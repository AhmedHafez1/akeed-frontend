'use client'

import { useCallback, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  getLocaleFromPathname,
  isSupportedLocale,
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

  const search = useMemo(() => {
    const serialized = searchParams.toString()
    return serialized ? `?${serialized}` : ''
  }, [searchParams])

  const handleLocaleChange = useCallback(
    (nextLocale: string) => {
      if (!isSupportedLocale(nextLocale) || nextLocale === locale) {
        return
      }

      const localizedPathname = buildLocalizedPathname(pathname, nextLocale)
      const destination = `${localizedPathname}${search}`

      startTransition(() => {
        router.replace(destination)
      })
    },
    [locale, pathname, router, search]
  )

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
