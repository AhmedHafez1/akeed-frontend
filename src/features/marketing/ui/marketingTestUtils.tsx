import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../../test/vitest/setup'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'

/**
 * jsdom has no IntersectionObserver, and the homepage animates on scroll. This
 * one never reports an intersection, so on-scroll motion stays put. A test
 * that needs it to fire stubs its own first.
 */
class IdleIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

/** Renders a homepage component with the real messages, in one locale. */
export function renderMarketing(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  if (!('IntersectionObserver' in globalThis)) {
    Object.assign(globalThis, {
      IntersectionObserver: IdleIntersectionObserver,
    })
  }
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
