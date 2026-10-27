import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../../../test/vitest/setup'
import ar from '../../../../../public/messages/ar.json'
import en from '../../../../../public/messages/en.json'
import type { TipCardView } from '../../domain/useTipCards'
import { TipEntryEmbedded } from './TipEntryEmbedded'

const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => router,
  usePathname: () => '/ar/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

function renderCard(
  view: TipCardView,
  canDismiss = true,
  locale: 'ar' | 'en' = 'ar'
) {
  testLocale.current = locale
  const handlers = { onSeen: vi.fn(), onAction: vi.fn(), onDismiss: vi.fn() }
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <AppProvider i18n={enTranslations}>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <TipEntryEmbedded view={view} canDismiss={canDismiss} {...handlers} />
        </div>
      </AppProvider>
    </NextIntlClientProvider>
  )
  return handlers
}

const base = {
  id: 'c1',
  type: 'update' as const,
  locale: 'ar',
  title: 'إلغاء تلقائي',
  description: 'ألغِ الطلبات التي لم يُرد عليها.',
  action: null,
  published_at: '2026-10-25T10:00:00.000Z',
}

describe('TipEntryEmbedded', () => {
  afterEach(() => vi.clearAllMocks())

  it('navigates in the app for an internal button and records the click', () => {
    const handlers = renderCard({
      card: base,
      link: {
        kind: 'internal',
        href: '/ar/settings?host=h&tab=timing',
        label: 'افتح الإعدادات',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'افتح الإعدادات' }))
    expect(handlers.onAction).toHaveBeenCalledWith('c1')
    expect(router.push).toHaveBeenCalledWith('/ar/settings?host=h&tab=timing')
  })

  it('opens an external button in a new tab without opener access', () => {
    const handlers = renderCard({
      card: base,
      link: {
        kind: 'external',
        href: 'https://akeed.app/docs',
        label: 'اقرأ الدليل',
      },
    })
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://akeed.app/docs')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.className).toContain('Polaris-Button--variantPrimary')
    fireEvent.click(link)
    expect(handlers.onAction).toHaveBeenCalledWith('c1')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('dismisses with an explaining label, and hides it from viewers', () => {
    const handlers = renderCard({ card: base, link: null })
    fireEvent.click(
      screen.getByRole('button', {
        name: ar.tips.dismiss.replace('{title}', base.title),
      })
    )
    expect(handlers.onDismiss).toHaveBeenCalledWith('c1')
    expect(screen.getByText(ar.tips.dismissLabel)).toBeTruthy()
    expect(handlers.onAction).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it.each(['en', 'ar'] as const)(
    'puts text dismissal before the primary action in the %s interface',
    (locale) => {
      const messages = locale === 'ar' ? ar : en
      // Campaign content can have a different direction from the interface.
      renderCard(
        {
          card: { ...base, locale: 'en', title: 'Your logo' },
          link: {
            kind: 'internal',
            href: '/en/settings',
            label: 'Add your logo',
          },
        },
        true,
        locale
      )
      const controls = screen.getAllByRole('button')
      expect(controls).toHaveLength(2)
      expect(controls[0].textContent).toBe(messages.tips.dismissLabel)
      expect(controls[0].getAttribute('aria-label')).toBe(
        messages.tips.dismiss.replace('{title}', 'Your logo')
      )
      expect(controls[0].className).toContain(
        'Polaris-Button--variantSecondary'
      )
      expect(controls[1].textContent).toBe('Add your logo')
      expect(controls[1].className).toContain('Polaris-Button--variantPrimary')
      expect(controls[0].closest('[dir]')?.getAttribute('dir')).toBe(
        locale === 'ar' ? 'rtl' : 'ltr'
      )
    }
  )

  it('keeps the primary action available to viewers', () => {
    renderCard(
      {
        card: base,
        link: {
          kind: 'internal',
          href: '/ar/settings',
          label: 'افتح الإعدادات',
        },
      },
      false
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'افتح الإعدادات' })).toBeTruthy()
    expect(screen.queryByText(ar.tips.dismissLabel)).toBeNull()
  })

  it('shows no dismiss control to viewers', () => {
    renderCard({ card: base, link: null }, false)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
