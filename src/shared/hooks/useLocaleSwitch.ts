import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  replacePathnameLocale,
  type SupportedLocale,
} from '@/shared/lib/locale'

/**
 * The interface language of the current page and the way to change it. The
 * choice is remembered, and the same page reopens in the new language.
 */
export function useLocaleSwitch() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)

  const switchLocale = useCallback(
    (nextLocale: SupportedLocale) => {
      if (nextLocale === locale) return
      persistLocalePreference(nextLocale)
      // Keep the query: an open import modal, a list filter or the setup
      // step survives the switch.
      router.push(
        `${replacePathnameLocale(pathname, nextLocale)}${window.location.search}`
      )
    },
    [locale, pathname, router]
  )

  return { locale, switchLocale }
}
