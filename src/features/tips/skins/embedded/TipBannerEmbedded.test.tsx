import { act, fireEvent, render, screen } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import type { TipCardView } from '../../domain/useTipCards'
import { TipBannerEmbedded } from './TipBannerEmbedded'

const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', async (original) => ({
  ...(await original<typeof import('next/navigation')>()),
  useRouter: () => router,
}))
let report: (ratio: number) => void
const base: TipCardView = {
  card: {
    id: 'c1',
    type: 'update',
    locale: 'en',
    title: 'Customer languages',
    description: 'Menu description',
    action: null,
    published_at: '2026-11-02T10:00:00Z',
    first_viewed_at: null,
  },
  link: null,
}

function setup(
  view: TipCardView | null = base,
  canDismiss = true,
  locale: 'ar' | 'en' = 'en'
) {
  const handlers = { onSeen: vi.fn(), onAction: vi.fn(), onDismiss: vi.fn() }
  const frame = (next: TipCardView | null) => (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      onError={(error) => {
        throw error
      }}
    >
      <AppProvider i18n={enTranslations}>
        <TipBannerEmbedded view={next} canDismiss={canDismiss} {...handlers} />
      </AppProvider>
    </NextIntlClientProvider>
  )
  const rendered = render(frame(view))
  return {
    ...rendered,
    ...handlers,
    replace: (next: TipCardView | null) => rendered.rerender(frame(next)),
  }
}

describe('TipBannerEmbedded', () => {
  beforeEach(() => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(element: Element) {
          report = (ratio) =>
            this.callback(
              [
                {
                  target: element,
                  isIntersecting: ratio > 0,
                  intersectionRatio: ratio,
                } as IntersectionObserverEntry,
              ],
              this as unknown as IntersectionObserver
            )
        }
        disconnect() {}
      }
    )
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders nothing without a banner and omits the description', () => {
    const { replace } = setup(null)
    expect(screen.queryByRole('complementary')).toBeNull()
    replace(base)
    expect(
      screen.getByRole('complementary', { name: en.tips.bannerLabel })
    ).toBeTruthy()
    expect(screen.getByText(en.tips.badge.update)).toBeTruthy()
    expect(screen.queryByText(base.card.description)).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('uses a plain internal action and a separately labeled dismissal', () => {
    const handlers = setup({
      ...base,
      link: {
        kind: 'internal',
        href: '/en/settings?host=h&tab=timing',
        label: 'Settings',
      },
    })
    const action = screen.getByRole('button', { name: 'Settings' })
    expect(action.className).toContain('Polaris-Button--variantPlain')
    fireEvent.click(action)
    expect(router.push).toHaveBeenCalledWith('/en/settings?host=h&tab=timing')
    expect(handlers.onAction).toHaveBeenCalledWith('c1', 1)
    fireEvent.click(
      screen.getByRole('button', {
        name: en.tips.dismiss.replace('{title}', base.card.title),
      })
    )
    expect(handlers.onDismiss).toHaveBeenCalledWith('c1', 1)
  })

  it('keeps a safe external plain action for viewers without dismissal', () => {
    const { onAction } = setup(
      {
        ...base,
        link: {
          kind: 'external',
          href: 'https://akeed.app/docs',
          label: 'Guide',
        },
      },
      false
    )
    const link = screen.getByRole('link', {
      name: `Guide (${en.tips.opensInNewTab})`,
    })
    expect(link.className).toContain('Polaris-Button--variantPlain')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    fireEvent.click(link)
    expect(onAction).toHaveBeenCalledWith('c1', 1)
    expect(screen.queryByRole('button')).toBeNull()
    expect(router.push).not.toHaveBeenCalled()
  })

  it.each([
    ['ar', 'en', 'ltr'],
    ['en', 'ar', 'rtl'],
  ] as const)(
    'uses the campaign direction in a %s interface',
    (locale, contentLocale, dir) => {
      setup(
        { ...base, card: { ...base.card, locale: contentLocale } },
        false,
        locale
      )
      const content = screen.getByText(base.card.title).closest('[lang]')!
      expect(content.getAttribute('lang')).toBe(contentLocale)
      expect(content.getAttribute('dir')).toBe(dir)
    }
  )

  it('requires two continuous visible seconds, restarts for replacement, and skips read cards', () => {
    vi.useFakeTimers()
    const handlers = setup()
    act(() => {
      report(1)
      vi.advanceTimersByTime(1500)
      report(0.4)
      vi.advanceTimersByTime(2000)
    })
    expect(handlers.onSeen).not.toHaveBeenCalled()
    act(() => {
      report(0.5)
      vi.advanceTimersByTime(1999)
    })
    expect(handlers.onSeen).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(handlers.onSeen).toHaveBeenCalledExactlyOnceWith('c1', 1)
    handlers.replace({ ...base, card: { ...base.card, id: 'c2' } })
    act(() => {
      report(1)
      vi.advanceTimersByTime(2000)
    })
    expect(handlers.onSeen).toHaveBeenLastCalledWith('c2', 1)
    expect(handlers.onSeen).toHaveBeenCalledTimes(2)
    handlers.replace({
      ...base,
      card: {
        ...base.card,
        id: 'read',
        first_viewed_at: '2026-11-02T10:00:00Z',
      },
    })
    act(() => vi.advanceTimersByTime(4000))
    expect(handlers.onSeen).toHaveBeenCalledTimes(2)
  })
})
