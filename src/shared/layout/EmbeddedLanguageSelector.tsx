'use client'

import { useCallback, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Select } from '@shopify/polaris'
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

  const languageOptions = useMemo(
    () => [
      { label: t('languageEnglish'), value: 'en' },
      { label: t('languageArabic'), value: 'ar' },
    ],
    [t]
  )

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

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <div className="w-full max-w-55">
          <Select
            label={t('defaultLanguageLabel')}
            options={languageOptions}
            value={locale}
            onChange={handleLocaleChange}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  )
}
