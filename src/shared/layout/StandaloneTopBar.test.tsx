import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStandaloneFirstRun } from '@/features/dashboard'
import { StandaloneTopBar } from './StandaloneTopBar'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/features/order-imports', () => ({
  ImportTopBarAction: () => <button type="button">Import orders</button>,
  useImportOutcomeSync: vi.fn(),
}))

vi.mock('@/features/orders', () => ({
  ManualOrderTopBarAction: () => <button type="button">Verify order</button>,
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

beforeEach(() => mockFirstRun('active'))

describe('StandaloneTopBar', () => {
  it('shows both order actions once the first real order exists', () => {
    render(<StandaloneTopBar onOpenNavigation={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Import orders' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Verify order' })).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
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
