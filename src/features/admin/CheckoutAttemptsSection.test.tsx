import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../public/messages/en.json'
import type {
  CheckoutAttemptRow,
  CheckoutAttemptsPage,
} from './checkout-attempts.model'
import { CheckoutAttemptsSection } from './CheckoutAttemptsSection'

const api = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./adminApi')>()),
  adminRequest: api.request,
}))
vi.mock('@/shared/hooks/useLocaleInfo', () => ({
  useLocaleInfo: () => ({ locale: 'en', isRTL: false }),
}))

function row(overrides: Partial<CheckoutAttemptRow> = {}): CheckoutAttemptRow {
  return {
    orgId: 'org-1',
    organizationName: 'Nile Leather Co.',
    owner: {
      name: 'Mona Adel',
      email: 'mona@nile-leather.test',
      whatsappPhone: '+20 100 000 0101',
    },
    source: { platformType: 'standalone', identity: 'org-1' },
    attempts: 2,
    firstAttemptAt: '2026-11-18T04:25:44.000Z',
    lastAttemptAt: '2026-11-18T04:26:11.000Z',
    paidEver: false,
    latest: {
      reference: 'akd_1',
      status: 'failed',
      outcome: 'declined',
      declineCode: 'authentication_failed',
      reconciliationCode: null,
      totalMinor: 20000,
      currency: 'EGP',
    },
    ...overrides,
  }
}

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <CheckoutAttemptsSection />
    </NextIntlClientProvider>
  )
}

describe('CheckoutAttemptsSection', () => {
  beforeEach(() => api.request.mockReset())

  it('asks for unpaid merchants first and shows how to reach them', async () => {
    api.request.mockResolvedValue({
      rows: [row()],
      nextOffset: null,
    } satisfies CheckoutAttemptsPage)
    renderSection()
    expect(api.request).toHaveBeenCalledWith(
      '/api/admin/standalone-billing/checkout-attempts?paid=unpaid&limit=25&offset=0'
    )
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Nile Leather Co.')).toBeTruthy()
    expect(
      within(table).getByText('Declined: authentication failed')
    ).toBeTruthy()
    const whatsapp = within(table).getByRole('link', {
      name: 'Message Mona Adel on WhatsApp',
    })
    expect(whatsapp.getAttribute('href')).toBe('https://wa.me/201000000101')
    expect(
      within(table)
        .getByRole('link', {
          name: 'Email Mona Adel at mona@nile-leather.test',
        })
        .getAttribute('href')
    ).toBe('mailto:mona@nile-leather.test')
    expect(
      within(table)
        .getByRole('link', {
          name: 'Open billing account for Nile Leather Co.',
        })
        .getAttribute('href')
    ).toBe('/en/admin/standalone-billing/org-1')
  })

  it('switches the filter and restarts from the first page', async () => {
    api.request.mockResolvedValue({ rows: [], nextOffset: null })
    renderSection()
    expect(
      await screen.findByText('Every merchant who started a checkout has paid.')
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'All' }))
    await screen.findByText('No merchant has started a checkout yet.')
    expect(api.request).toHaveBeenLastCalledWith(
      '/api/admin/standalone-billing/checkout-attempts?paid=all&limit=25&offset=0'
    )
  })

  it('marks a merchant who paid before and pages forward', async () => {
    api.request.mockResolvedValue({
      rows: [
        row({
          paidEver: true,
          owner: { name: null, email: null, whatsappPhone: null },
          latest: {
            ...row().latest,
            outcome: 'left_checkout',
            status: 'expired',
          },
        }),
      ],
      nextOffset: 25,
    })
    renderSection()
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Left checkout')).toBeTruthy()
    expect(within(table).getByText('Paid before')).toBeTruthy()
    expect(within(table).getByText('No contact details')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('table')
    expect(api.request).toHaveBeenLastCalledWith(
      '/api/admin/standalone-billing/checkout-attempts?paid=unpaid&limit=25&offset=25'
    )
  })

  it('offers a retry when the list cannot load', async () => {
    api.request.mockRejectedValue(new Error('offline'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderSection()
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not load checkout attempts.'
    )
    api.request.mockResolvedValue({ rows: [row()], nextOffset: null })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('table')).toBeTruthy()
  })
})
