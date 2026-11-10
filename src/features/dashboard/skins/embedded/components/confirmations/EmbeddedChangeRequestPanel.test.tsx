import { screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import ar from '../../../../../../../public/messages/ar.json'
import en from '../../../../../../../public/messages/en.json'
import type { ChangeRequestSummary } from '@/features/dashboard/model/dashboard.model'
import { renderEmbedded } from '../embeddedTestUtils'
import { EmbeddedChangeRequestPanel } from './EmbeddedChangeRequestPanel'

// Contact tools must not send requests through Akeed.
const auth = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  fetchWithAuth: vi.fn(),
}))
vi.mock('@/shared/lib/auth', () => auth)

function renderPanel(
  locale: 'en' | 'ar',
  phone: string | null,
  overrides: Partial<ChangeRequestSummary> = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return renderEmbedded(
    <QueryClientProvider client={client}>
      <EmbeddedChangeRequestPanel
        verificationId="verification-1"
        orderLabel="#1187"
        summary={{
          id: 'cr-1',
          opened_at: '2026-11-08T10:00:00.000Z',
          confirmation_cycle: 3,
          acknowledgment: { status: 'done', reason: null },
          reconfirmation: {
            state: null,
            scheduled_for: null,
            last_error: null,
          },
          ...overrides,
        }}
        phone={phone}
        timeZone="Africa/Cairo"
        canAct={false}
      />
    </QueryClientProvider>,
    locale
  )
}

describe.each([
  ['en', en.dashboard.changeRequest],
  ['ar', ar.dashboard.changeRequest],
] as const)('EmbeddedChangeRequestPanel (%s)', (locale, t) => {
  it.each(['done', 'skipped', 'failed'] as const)(
    'shows only the request title with %s acknowledgment and failed email',
    (status) => {
      renderPanel(locale, '+20 100 123 4567', {
        acknowledgment: { status, reason: null },
        merchant_email: { status: 'failed', reason: 'no_recipient' },
      })

      const banner = screen.getByRole('alert')
      expect(screen.getByRole('heading', { name: t.panelTitle })).toBeTruthy()
      expect(banner.textContent).toBe(t.panelTitle)
      expect(banner.querySelector('svg')).toBeNull()
      for (const text of [
        t.ackSent,
        t.ackSkipped,
        t.ackFailed,
        t.emailUnavailable,
      ])
        expect(screen.queryByText(text)).toBeNull()
      expect(screen.getByRole('link', { name: t.call })).toBeTruthy()
    }
  )

  it('opens the normalized call URL outside the app frame', () => {
    renderPanel(locale, '+20 100 123 4567')

    const call = screen.getByRole('link', { name: t.call })
    expect(call.getAttribute('href')).toBe('tel:+201001234567')
    expect(call.getAttribute('target')).toBe('_blank')
    expect(call.getAttribute('rel')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer'])
    )
    expect(auth.api.post).not.toHaveBeenCalled()
  })

  it.each([null, '', '12345'])('disables contact tools for %j', (phone) => {
    renderPanel(locale, phone)

    expect(screen.getByText(t.noPhone)).toBeTruthy()
    for (const name of [t.openWhatsapp, t.call, t.copy]) {
      expect(screen.queryByRole('link', { name })).toBeNull()
      const button = screen.getByRole('button', { name })
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.getAttribute('tabindex')).toBe('-1')
    }
    expect(auth.api.post).not.toHaveBeenCalled()
  })
})
