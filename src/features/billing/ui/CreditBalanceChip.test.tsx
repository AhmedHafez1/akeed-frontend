import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import { useBillingSummary } from '../domain/useBillingSummary'
import { CreditBalanceChip } from './CreditBalanceChip'

vi.mock('../domain/useBillingSummary', () => ({ useBillingSummary: vi.fn() }))

function mockSummary(
  summary: {
    availableCredits: number
    price?: { unitPriceMinor: number; currency: string }
  } | null,
  { isLoading = false, error = null as Error | null } = {}
) {
  vi.mocked(useBillingSummary).mockReturnValue({
    summary,
    isLoading,
    error,
    refresh: vi.fn(),
  } as unknown as ReturnType<typeof useBillingSummary>)
}

function renderChip() {
  return render(
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <CreditBalanceChip />
    </NextIntlClientProvider>
  )
}

beforeEach(() =>
  mockSummary({
    availableCredits: 31,
    price: { unitPriceMinor: 50, currency: 'EGP' },
  })
)

describe('CreditBalanceChip', () => {
  it('shows the balance as money and links to billing', () => {
    renderChip()
    // 31 displayed credits at EGP 0.50.
    const link = screen.getByRole('link', { name: 'الرصيد 15.5 ج.م' })
    expect(link.getAttribute('href')).toBe('/ar/billing')
  })

  it('shows no placeholder number while the balance loads', () => {
    mockSummary(null, { isLoading: true })
    renderChip()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('renders nothing when the balance failed to load', () => {
    mockSummary(null, { error: new Error('offline') })
    const { container } = renderChip()
    expect(container.textContent).toBe('')
  })
})
