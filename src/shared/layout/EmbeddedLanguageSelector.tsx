'use client'

import { useCallback, useEffect, useMemo, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  getPersistedLocalePreference,
  getLocaleFromPathname,
  getLocaleNativeName,
  isSupportedLocale,
  persistLocalePreference,
  replacePathnameLocale,
  SUPPORTED_LOCALES,
} from '@/shared/lib/locale'
import { resolveEmbeddedContextFromSearch } from '@/shared/lib/embedded-context'
import { createAkeedEmbeddedSupportWhatsAppUrl } from '@/shared/lib/whatsapp'

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
      {/*
       * One menu, named after the language in use; Shopify draws a `section`
       * as a dropdown. Each language is listed under its own name, so a
       * merchant can find theirs whatever language the app opened in.
       */}
      <section
        label={
          isPending
            ? t('languageSwitching')
            : `${support('localeLabel')}: ${getLocaleNativeName(locale)}`
        }
      >
        {SUPPORTED_LOCALES.filter((option) => option !== locale).map(
          (option) => (
            // Shopify accepts no attributes on a button inside a section, so
            // a switch in progress is ignored here instead of disabling it.
            <button
              key={option}
              onClick={() => {
                if (!isPending) handleLocaleChange(option)
              }}
            >
              {getLocaleNativeName(option)}
            </button>
          )
        )}
      </section>
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
