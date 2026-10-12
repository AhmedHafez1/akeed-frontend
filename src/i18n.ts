import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from './shared/lib/locale'

// The list of interface languages lives in `shared/lib/locale`.
export const locales = SUPPORTED_LOCALES
export type Locale = SupportedLocale

export const defaultLocale: Locale = DEFAULT_LOCALE

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  if (!locale || !locales.includes(locale as Locale)) notFound()

  return {
    locale,
    messages: (await import(`../public/messages/${locale}.json`)).default,
  }
})
