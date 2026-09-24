import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/** The locale the mocked router reports; component tests set it per render. */
export const testLocale = { current: 'ar' as 'ar' | 'en' }

vi.mock('next/navigation', () => ({
  usePathname: () => `/${testLocale.current}/dashboard`,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}

afterEach(() => cleanup())
