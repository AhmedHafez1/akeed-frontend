import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../../../../test/vitest/setup'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'

/** Renders an embedded component the way the app does, in one locale. */
export function renderEmbedded(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  testLocale.current = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  return render(
    <NextIntlClientProvider
      locale={lang}
      messages={lang === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <AppProvider i18n={enTranslations}>{ui}</AppProvider>
    </NextIntlClientProvider>
  )
}
