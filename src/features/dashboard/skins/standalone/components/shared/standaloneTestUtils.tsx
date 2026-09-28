import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../../../../../test/vitest/setup'
import ar from '../../../../../../../public/messages/ar.json'
import en from '../../../../../../../public/messages/en.json'

/** Renders a standalone component with the real messages, in one locale. */
export function renderStandalone(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  testLocale.current = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={lang}
        messages={lang === 'ar' ? ar : en}
        timeZone="UTC"
      >
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}
