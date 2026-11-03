import { act, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import { TipBanner, type TipBannerProps } from './TipBanner'

let report: (ratio: number) => void
const base: TipBannerProps['view'] = {
  card: {
    id: 'c1',
    type: 'update',
    locale: 'en',
    title: 'Customer languages',
    description: 'Only shown in the menu.',
    action: null,
    published_at: '2026-11-02T10:00:00Z',
  },
  link: null,
}

function setup(view = base, canDismiss = true, locale: 'ar' | 'en' = 'en') {
  const handlers = { onSeen: vi.fn(), onAction: vi.fn(), onDismiss: vi.fn() }
  const rendered = render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      onError={(error) => {
        throw error
      }}
    >
      <TipBanner view={view} canDismiss={canDismiss} {...handlers} />
    </NextIntlClientProvider>
  )
  return { ...rendered, ...handlers }
}

describe('TipBanner', () => {
  beforeEach(() => {
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
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it.each(['tip', 'update', 'change', 'note'] as const)(
    'shows the %s badge and title without its description',
    (type) => {
      setup({ ...base, card: { ...base.card, type } })
      expect(
        screen.getByRole('complementary', { name: en.tips.bannerLabel })
      ).toBeTruthy()
      expect(screen.getByText(en.tips.badge[type])).toBeTruthy()
      expect(screen.getByText(base.card.title).className).toContain('truncate')
      expect(screen.queryByText(base.card.description)).toBeNull()
      expect(screen.queryByRole('link')).toBeNull()
    }
  )

  it('records a view once, after half the strip is on screen', () => {
    const { onSeen } = setup()
    act(() => report(0.49))
    expect(onSeen).not.toHaveBeenCalled()
    act(() => {
      report(0.5)
      report(1)
    })
    expect(onSeen).toHaveBeenCalledExactlyOnceWith('c1', 1)
  })

  it('records internal navigation and permanent dismissal separately', () => {
    const handlers = setup({
      ...base,
      link: {
        kind: 'internal',
        href: '/en/settings?tab=timing',
        label: 'Open settings',
      },
    })
    const link = screen.getByRole('link', { name: 'Open settings' })
    expect(link.getAttribute('href')).toBe('/en/settings?tab=timing')
    fireEvent.click(link)
    expect(handlers.onAction).toHaveBeenCalledWith('c1', 1)
    fireEvent.click(
      screen.getByRole('button', {
        name: en.tips.dismiss.replace('{title}', base.card.title),
      })
    )
    expect(handlers.onDismiss).toHaveBeenCalledWith('c1', 1)
  })

  it('retains a safe external action for viewers without a dismiss button', () => {
    const { onAction } = setup(
      {
        ...base,
        link: {
          kind: 'external',
          href: 'https://akeed.app/docs',
          label: 'Read guide',
        },
      },
      false
    )
    const link = screen.getByRole('link', {
      name: `Read guide (${en.tips.opensInNewTab})`,
    })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    fireEvent.click(link)
    expect(onAction).toHaveBeenCalledWith('c1', 1)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it.each([
    ['ar', 'en', 'ltr'],
    ['en', 'ar', 'rtl'],
  ] as const)(
    'uses the content direction in a %s interface',
    (locale, contentLocale, dir) => {
      setup(
        {
          ...base,
          card: { ...base.card, locale: contentLocale },
          link: { kind: 'internal', href: '/en/settings', label: 'Settings' },
        },
        true,
        locale
      )
      const content = screen.getByText(base.card.title).parentElement!
      expect(content.getAttribute('lang')).toBe(contentLocale)
      expect(content.getAttribute('dir')).toBe(dir)
      expect(screen.getByRole('link').parentElement).toBe(content)
      const messages = locale === 'ar' ? ar : en
      expect(
        screen.getByRole('button', {
          name: messages.tips.dismiss.replace('{title}', base.card.title),
        })
      ).toBeTruthy()
    }
  )
})
