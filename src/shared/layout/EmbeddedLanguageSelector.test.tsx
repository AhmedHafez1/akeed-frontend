import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCALE_PREFERENCE_STORAGE_KEY,
  persistLocalePreference,
} from '@/shared/lib/locale'
import { EmbeddedLanguageSelector } from './EmbeddedLanguageSelector'

const route = vi.hoisted(() => ({
  pathname: '/ar/settings',
  search: 'shop=demo.myshopify.com',
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ replace: route.replace }),
  useSearchParams: () => new URLSearchParams(route.search),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

beforeEach(() => {
  route.pathname = '/ar/settings'
  route.replace.mockReset()
  localStorage.clear()
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
})

describe('EmbeddedLanguageSelector', () => {
  it('groups the other languages in one menu named after the current one', () => {
    const { container } = render(<EmbeddedLanguageSelector />)

    const menu = container.querySelector('ui-title-bar > section')
    expect(menu?.getAttribute('label')).toBe('localeLabel: العربية')
    expect(
      [...(menu?.querySelectorAll('button') ?? [])].map(
        (button) => button.textContent
      )
    ).toEqual(['English', 'اردو', 'Español', 'Français'])
  })

  it('remembers Urdu and reopens the page in it, keeping the shop', async () => {
    render(<EmbeddedLanguageSelector />)

    fireEvent.click(screen.getByText('اردو'))

    await waitFor(() =>
      expect(route.replace).toHaveBeenCalledWith(
        '/ur/settings?shop=demo.myshopify.com'
      )
    )
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('ur')
  })

  it('remembers Spanish and reopens the page in it, keeping the shop', async () => {
    render(<EmbeddedLanguageSelector />)

    fireEvent.click(screen.getByText('Español'))

    await waitFor(() =>
      expect(route.replace).toHaveBeenCalledWith(
        '/es/settings?shop=demo.myshopify.com'
      )
    )
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('es')
  })

  it('remembers French and reopens the page in it, keeping the shop', async () => {
    render(<EmbeddedLanguageSelector />)

    fireEvent.click(screen.getByText('Français'))

    await waitFor(() =>
      expect(route.replace).toHaveBeenCalledWith(
        '/fr/settings?shop=demo.myshopify.com'
      )
    )
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('fr')
  })

  it('restores a remembered French choice when the app opens in Arabic', async () => {
    persistLocalePreference('fr')

    render(<EmbeddedLanguageSelector />)

    await waitFor(() =>
      expect(route.replace).toHaveBeenCalledWith(
        '/fr/settings?shop=demo.myshopify.com'
      )
    )
  })

  it('restores a remembered Urdu choice when the app opens in Arabic', async () => {
    persistLocalePreference('ur')

    render(<EmbeddedLanguageSelector />)

    await waitFor(() =>
      expect(route.replace).toHaveBeenCalledWith(
        '/ur/settings?shop=demo.myshopify.com'
      )
    )
  })

  it('remembers the language the app opened in when nothing is stored', () => {
    route.pathname = '/ur/settings'

    render(<EmbeddedLanguageSelector />)

    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('ur')
    expect(route.replace).not.toHaveBeenCalled()
  })
})
