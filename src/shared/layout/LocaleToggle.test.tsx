import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCALE_PREFERENCE_STORAGE_KEY,
  getPersistedLocalePreference,
} from '@/shared/lib/locale'
import { LocaleToggle } from './LocaleToggle'

const route = vi.hoisted(() => ({
  pathname: '/ar/billing',
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: route.push }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

/** Opens the menu the way a keyboard user does. */
function openMenu() {
  const trigger = screen.getByRole('button', { name: 'changeLocale' })
  fireEvent.keyDown(trigger, { key: 'Enter' })
  return trigger
}

beforeEach(() => {
  route.pathname = '/ar/billing'
  route.push.mockReset()
  localStorage.clear()
  window.history.replaceState(null, '', '/ar/billing?tab=usage')
})

describe('LocaleToggle', () => {
  it('names the current language and offers every language', () => {
    render(<LocaleToggle />)

    const trigger = screen.getByRole('button', { name: 'changeLocale' })
    expect(trigger.textContent).toBe('العربية')

    openMenu()

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual(['العربية', 'English', 'اردو', 'Español', 'Français', 'Türkçe'])
    expect(
      screen
        .getByRole('menuitem', { name: 'العربية' })
        .getAttribute('aria-current')
    ).toBe('true')
  })

  it('remembers Urdu and reopens the same page and query in it', () => {
    render(<LocaleToggle />)

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'اردو' }))

    expect(route.push).toHaveBeenCalledWith('/ur/billing?tab=usage')
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('ur')
    expect(getPersistedLocalePreference()).toBe('ur')
  })

  it('remembers Spanish and reopens the same page and query in it', () => {
    render(<LocaleToggle />)

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Español' }))

    expect(route.push).toHaveBeenCalledWith('/es/billing?tab=usage')
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('es')
    expect(getPersistedLocalePreference()).toBe('es')
  })

  it('remembers French and reopens the same page and query in it', () => {
    render(<LocaleToggle />)

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Français' }))

    expect(route.push).toHaveBeenCalledWith('/fr/billing?tab=usage')
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('fr')
    expect(getPersistedLocalePreference()).toBe('fr')
  })

  it('remembers Turkish and reopens the same page and query in it', () => {
    render(<LocaleToggle />)

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Türkçe' }))

    expect(route.push).toHaveBeenCalledWith('/tr/billing?tab=usage')
    expect(localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY)).toBe('tr')
    expect(getPersistedLocalePreference()).toBe('tr')
  })

  it('does nothing when the current language is chosen again', () => {
    route.pathname = '/ur/billing'
    render(<LocaleToggle />)

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'اردو' }))

    expect(route.push).not.toHaveBeenCalled()
  })
})
