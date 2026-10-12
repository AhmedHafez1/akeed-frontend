'use client'

import { useCallback, useEffect, useMemo, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  getPersistedLocalePreference,
  getLocaleFromPathname,
  isSupportedLocale,
  persistLocalePreference,
  replacePathnameLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/shared/lib/locale'
import { resolveEmbeddedContextFromSearch } from '@/shared/lib/embedded-context'
import { createAkeedEmbeddedSupportWhatsAppUrl } from '@/shared/lib/whatsapp'

/** The title-bar label that switches to each language. */
const SWITCH_LABEL_KEYS: Record<SupportedLocale, string> = {
  ar: 'switchToArabic',
  en: 'switchToEnglish',
  ur: 'switchToUrdu',
  es: 'switchToSpanish',
}

export function EmbeddedLanguageSelector() {
  const t = useTranslations('settings')
  const support = useTranslations('embeddedSupport')
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

  const embeddedContext = useMemo(
    () => resolveEmbeddedContextFromSearch(searchParams),
    [searchParams]
  )

  const handleLocaleChange = useCallback(
    (nextLocale: string) => {
      if (!isSupportedLocale(nextLocale) || nextLocale === locale) {
        return
      }

      persistLocalePreference(nextLocale)

      const localizedPathname = replacePathnameLocale(pathname, nextLocale)
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

  return (
    <ui-title-bar title="Akeed">
      {SUPPORTED_LOCALES.filter((option) => option !== locale).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleLocaleChange(option)}
          disabled={isPending}
        >
          {isPending ? t('languageSwitching') : t(SWITCH_LABEL_KEYS[option])}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          window.open(
            createAkeedEmbeddedSupportWhatsAppUrl({
              defaultMessage: support('defaultMessage'),
              shopLabel: support('shopLabel'),
              pageLabel: support('pageLabel'),
              localeLabel: support('localeLabel'),
              issuePrompt: support('issuePrompt'),
              shopDomain: embeddedContext.shopDomain,
              pathname,
              locale,
            }),
            '_blank',
            'noopener,noreferrer'
          )
        }}
      >
        {support('titleBarAction')}
      </button>
    </ui-title-bar>
  )
}
