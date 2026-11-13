import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MarketingScripts } from './MarketingScripts'
const route = vi.hoisted(() => ({ path: '/en/signup/google' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.path }))
vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({ isStandalone: true }),
}))
vi.mock('./useInstallClickTracking', () => ({
  useInstallClickTracking: vi.fn(),
}))
vi.mock('next/script', () => ({
  default: ({ id, src }: { id?: string; src?: string }) => (
    <span data-testid="tracking-script">{id ?? src}</span>
  ),
}))
it.each(['en', 'ar', 'ur', 'es', 'fr', 'tr'])(
  'does not initialize marketing scripts on the %s Google callback',
  (locale) => {
    route.path = `/${locale}/signup/google`
    render(<MarketingScripts />)
    expect(screen.queryByTestId('tracking-script')).toBeNull()
  }
)
it('keeps ordinary login analytics available', () => {
  route.path = '/en/login'
  render(<MarketingScripts />)
  expect(screen.getAllByTestId('tracking-script')).toHaveLength(3)
})
