import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStandaloneFirstRun } from '@/features/dashboard'
import { StandaloneTopBar } from './StandaloneTopBar'

const route = vi.hoisted(() => ({ pathname: '/ar/dashboard' }))

vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/features/order-imports', () => ({
  ImportTopBarAction: () => <button type="button">Import orders</button>,
  useImportOutcomeSync: vi.fn(),
}))

vi.mock('@/features/orders', () => ({
  ManualOrderTopBarAction: ({ emphasis }: { emphasis?: string }) => (
    <button type="button" data-emphasis={emphasis}>
      Verify order
    </button>
  ),
}))
vi.mock('@/features/billing', () => ({
  CreditBalanceChip: () => <span role="link">Balance 30 messages</span>,
}))
vi.mock('@/features/dashboard', () => ({ useStandaloneFirstRun: vi.fn() }))
vi.mock('@/shared/theme', () => ({ ThemeToggle: () => null }))
vi.mock('./LocaleToggle', () => ({ LocaleToggle: () => null }))

function mockFirstRun(status: 'loading' | 'first-run' | 'active') {
  vi.mocked(useStandaloneFirstRun).mockReturnValue({
    status,
    showSkippedTestReminder: false,
  })
}

beforeEach(() => {
  route.pathname = '/ar/dashboard'
  mockFirstRun('active')
})

describe('StandaloneTopBar', () => {
  it.each([
    ['/ar/dashboard', 'dashboard'],
    ['/ar/verifications', 'verifications'],
    ['/ar/imports/new', 'verifications'],
    ['/ar/settings', 'settings'],
    ['/ar/billing', 'billing'],
    // Templates is a tab of Settings now, so it has no title of its own.
    ['/ar/templates', 'dashboard'],
  ])('titles %s as %s', (pathname, title) => {
    route.pathname = pathname
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumbs' })
    expect(breadcrumb.textContent).toBe(`workspace${title}`)
  })

  it('puts the payment return page under a link back to Billing', () => {
    route.pathname = '/ar/billing/return'
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumbs' })
    expect(breadcrumb.textContent).toBe('billingpaymentStatus')
    expect(
      screen.getByRole('link', { name: 'billing' }).getAttribute('href')
    ).toBe('/ar/billing')
  })

  it('shows both order actions once the first real order exists', () => {
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Import orders' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Verify order' })).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('keeps Verify order primary, except on billing where Pay is primary', () => {
    const emphasisOn = (pathname: string) => {
      route.pathname = pathname
      const { unmount } = render(
        <StandaloneTopBar onOpenNavigation={vi.fn()} />
      )
      const emphasis = screen
        .getByRole('button', { name: 'Verify order' })
        .getAttribute('data-emphasis')
      unmount()
      return emphasis
    }

    expect(emphasisOn('/ar/dashboard')).toBe('primary')
    expect(emphasisOn('/ar/verifications')).toBe('primary')
    expect(emphasisOn('/ar/billing')).toBe('secondary')
  })

  it('hides Import and Verify order in first run, where the card owns them', () => {
    mockFirstRun('first-run')
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Import orders' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Verify order' })).toBeNull()
  })

  it('keeps them hidden while first run is unknown, so they never flash', () => {
    mockFirstRun('loading')
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Import orders' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Verify order' })).toBeNull()
  })

  it('always shows the balance chip', () => {
    for (const status of ['first-run', 'active'] as const) {
      mockFirstRun(status)
      const { unmount } = render(
        <StandaloneTopBar onOpenNavigation={vi.fn()} />
      )
      expect(
        screen.getByRole('link', { name: 'Balance 30 messages' })
      ).toBeTruthy()
      unmount()
    }
  })
})
