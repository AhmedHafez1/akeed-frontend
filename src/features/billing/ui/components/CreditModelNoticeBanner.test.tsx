import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../../../public/messages/en.json'
import {
  dismissCreditModelNotice,
  fetchCreditModelNotice,
} from '../../api/billingApi'
import { CreditModelNoticeBanner } from './CreditModelNoticeBanner'

vi.mock('../../api/billingApi', () => ({
  fetchCreditModelNotice: vi.fn(),
  dismissCreditModelNotice: vi.fn(),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

const title = en.billing.creditModelNotice.title
const dismiss = en.billing.creditModelNotice.dismiss

describe('CreditModelNoticeBanner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tells an owner what changed and hides once dismissed', async () => {
    vi.mocked(fetchCreditModelNotice).mockResolvedValue({
      visible: true,
      canDismiss: true,
    })
    vi.mocked(dismissCreditModelNotice).mockResolvedValue(undefined)
    render(<CreditModelNoticeBanner />, { wrapper })

    expect(await screen.findByText(title)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: dismiss }))

    await waitFor(() => expect(screen.queryByText(title)).toBeNull())
  })

  it('shows a viewer the notice with nothing to dismiss', async () => {
    vi.mocked(fetchCreditModelNotice).mockResolvedValue({
      visible: true,
      canDismiss: false,
    })
    render(<CreditModelNoticeBanner />, { wrapper })

    expect(await screen.findByText(title)).toBeTruthy()
    // Only the help icon; nothing to dismiss.
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: title })).toBeTruthy()
  })

  it('shows nothing for an organization with no notice', async () => {
    vi.mocked(fetchCreditModelNotice).mockResolvedValue({
      visible: false,
      canDismiss: true,
    })
    const { container } = render(<CreditModelNoticeBanner />, { wrapper })

    await waitFor(() => expect(fetchCreditModelNotice).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })

  it('stays silent when the notice cannot be read', async () => {
    vi.mocked(fetchCreditModelNotice).mockRejectedValue(new Error('404'))
    const { container } = render(<CreditModelNoticeBanner />, { wrapper })

    await waitFor(() => expect(fetchCreditModelNotice).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })
})
