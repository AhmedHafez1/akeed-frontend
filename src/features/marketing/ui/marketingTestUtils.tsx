import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../../test/vitest/setup'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'

/** Renders a homepage component with the real messages, in one locale. */
export function renderMarketing(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  testLocale.current = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  return render(
    <NextIntlClientProvider
      locale={lang}
      messages={lang === 'ar' ? ar : en}
      timeZone="UTC"
    >
      {ui}
    </NextIntlClientProvider>
  )
}
