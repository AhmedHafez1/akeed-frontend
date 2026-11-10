import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/http'
import type { ChangeRequestSummary } from '@/features/dashboard/model/dashboard.model'
import { renderStandalone } from '../shared/standaloneTestUtils'
import { ChangeRequestPanel } from './ChangeRequestPanel'

const auth = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  fetchWithAuth: vi.fn(),
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

// No request leaves the test.
vi.mock('@/shared/lib/auth', () => auth)
vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/ui')>()),
  notify: toast,
}))

function summary(
  overrides: Partial<ChangeRequestSummary> = {}
): ChangeRequestSummary {
  return {
    id: 'cr-1',
    opened_at: '2026-11-08T10:00:00.000Z',
    confirmation_cycle: 3,
    acknowledgment: { status: 'done', reason: null },
    reconfirmation: { state: null, scheduled_for: null, last_error: null },
    ...overrides,
  }
}

function renderPanel(
  options: {
    summary?: ChangeRequestSummary
    phone?: string | null
    canAct?: boolean
    lang?: 'ar' | 'en'
  } = {}
) {
  return renderStandalone(
    <ChangeRequestPanel
      verificationId="ver-1"
      orderLabel="#1187"
      summary={options.summary ?? summary()}
      phone={options.phone === undefined ? '+201001234567' : options.phone}
      timeZone="Africa/Cairo"
      canAct={options.canAct ?? true}
    />,
    options.lang ?? 'en'
  )
}

describe('ChangeRequestPanel', () => {
  it('keeps the title and merchant actions without the email warning after email failure', () => {
    renderPanel({
      summary: summary({
        merchant_email: { status: 'failed', reason: 'no_recipient' },
      }),
    })
    expect(
      screen.queryByText(
        'The email notification could not be confirmed. This request is still available here.'
      )
    ).toBeNull()
    expect(screen.getByText('Changes requested by the customer')).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: 'Confirmed after contacting customer',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
  })
  beforeEach(() => {
    auth.api.get.mockReset()
    auth.api.post.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('shows only the request title above contact links that open outside Akeed', () => {
    renderPanel()
    expect(screen.getByText('Changes requested by the customer')).toBeTruthy()
    const title = screen.getByRole('heading', {
      name: 'Changes requested by the customer',
    })
    expect(title.parentElement?.textContent).toBe(
      'Changes requested by the customer'
    )
    expect(title.parentElement?.querySelector('svg')).toBeNull()
    expect(screen.queryByText('Customer notified')).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Open WhatsApp' }).getAttribute('href')
    ).toBe('https://wa.me/201001234567')
    expect(
      screen.getByRole('link', { name: 'Call' }).getAttribute('href')
    ).toBe('tel:+201001234567')
    expect(auth.api.post).not.toHaveBeenCalled()
  })

  it('disables the contact tools without a usable number', () => {
    renderPanel({ phone: null })
    expect(screen.getByText('No valid phone number')).toBeTruthy()
    for (const name of ['Open WhatsApp', 'Call', 'Copy number'])
      expect(
        (screen.getByRole('button', { name }) as HTMLButtonElement).disabled
      ).toBe(true)
  })

  it.each(['skipped', 'failed'] as const)(
    'hides the %s acknowledgment notice',
    (status) => {
      renderPanel({
        summary: summary({
          acknowledgment: { status, reason: 'skipped_no_allowance' },
        }),
      })
      expect(screen.queryByText('Customer not notified: no balance')).toBeNull()
      expect(
        screen.queryByText('Customer not notified: not delivered')
      ).toBeNull()
      const title = screen.getByRole('heading', {
        name: 'Changes requested by the customer',
      })
      expect(title.parentElement?.textContent).toBe(
        'Changes requested by the customer'
      )
    }
  )

  it('confirms in one tap, naming the request the page showed', async () => {
    auth.api.post.mockResolvedValue({ success: true, status: 'confirmed' })
    renderPanel()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmed after contacting customer',
      })
    )
    await waitFor(() =>
      expect(auth.api.post).toHaveBeenCalledWith(
        '/api/verifications/ver-1/change-request/confirm',
        { changeRequestId: 'cr-1' }
      )
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Order confirmed.' })
      )
    )
  })

  it('asks before cancelling', async () => {
    auth.api.post.mockResolvedValue({ success: true, status: 'canceled' })
    renderPanel()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Cancelled after contacting customer',
      })
    )
    expect(auth.api.post).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, cancel' }))
    await waitFor(() =>
      expect(auth.api.post).toHaveBeenCalledWith(
        '/api/verifications/ver-1/change-request/cancel',
        { changeRequestId: 'cr-1' }
      )
    )
  })

  it('sends the cycle it was asked in with a resend', async () => {
    auth.api.post.mockResolvedValue({ reconfirmation: {} })
    renderPanel()
    fireEvent.click(
      screen.getByRole('button', { name: 'Send updated confirmation' })
    )
    await waitFor(() =>
      expect(auth.api.post).toHaveBeenCalledWith(
        '/api/verifications/ver-1/change-request/resend',
        { changeRequestId: 'cr-1', expectedCycle: 3 }
      )
    )
  })

  it('reports what won when the customer answered first', async () => {
    auth.api.post.mockRejectedValue(
      new ApiError('resolved', 409, 'CHANGE_REQUEST_ALREADY_RESOLVED')
    )
    auth.api.get.mockResolvedValue({
      change_request: {
        id: 'cr-1',
        status: 'resolved',
        resolution: 'customer_confirmed',
      },
    })
    renderPanel()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmed after contacting customer',
      })
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Already confirmed by the customer.',
        })
      )
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it.each([
    [{ state: 'requested' as const }, 'Sending…', false],
    [
      {
        state: 'failed' as const,
        last_error: 'no_allowance',
      },
      'Not sent: no balance',
      true,
    ],
    [
      {
        state: 'failed' as const,
        last_error: 'order_not_found',
      },
      'Not sent: order not found in your store',
      false,
    ],
  ])('shows the resend %j as one line', (reconfirmation, text, retry) => {
    renderPanel({
      summary: summary({
        reconfirmation: {
          scheduled_for: null,
          last_error: null,
          ...reconfirmation,
        },
      }),
    })
    expect(screen.getByText(text)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Try again' }) !== null).toBe(
      retry
    )
    if (reconfirmation.state === 'requested')
      expect(
        (
          screen.getByRole('button', {
            name: 'Send updated confirmation',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
  })

  it('shows a viewer the facts and contact tools but no outcomes', () => {
    renderPanel({ canAct: false })
    expect(
      screen.queryByRole('button', {
        name: 'Confirmed after contacting customer',
      })
    ).toBeNull()
    expect(screen.getByRole('link', { name: 'Call' })).toBeTruthy()
  })

  it('reads right to left in Arabic', () => {
    renderPanel({ lang: 'ar' })
    expect(screen.getByText('تغييرات طلبها العميل')).toBeTruthy()
    expect(document.documentElement.dir).toBe('rtl')
  })
})
