import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import { testLocale } from '../../../../../test/vitest/setup'
import ar from '../../../../../public/messages/ar.json'
import type { TipCardView } from '../../domain/useTipCards'
import { TipCardEmbedded } from './TipCardEmbedded'

const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => router,
  usePathname: () => '/ar/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

function renderCard(view: TipCardView, canDismiss = true) {
  testLocale.current = 'ar'
  const handlers = { onSeen: vi.fn(), onAction: vi.fn(), onDismiss: vi.fn() }
  render(
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <AppProvider i18n={enTranslations}>
        <TipCardEmbedded view={view} canDismiss={canDismiss} {...handlers} />
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

describe('TipCardEmbedded', () => {
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
    renderCard({
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
  })

  it('dismisses with an explaining label, and hides it from viewers', () => {
    const handlers = renderCard({ card: base, link: null })
    fireEvent.click(
      screen.getByRole('button', {
        name: ar.tips.dismiss.replace('{title}', base.title),
      })
    )
    expect(handlers.onDismiss).toHaveBeenCalledWith('c1')
  })

  it('shows no dismiss control to viewers', () => {
    renderCard({ card: base, link: null }, false)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
