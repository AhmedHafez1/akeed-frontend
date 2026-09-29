import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'

/** Renders a standalone onboarding component with real translations, Arabic by default. */
export function renderOnboardingStandalone(
  ui: ReactElement,
  lang: 'ar' | 'en' = 'ar'
) {
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
