import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import type { SourceHealth } from '../../../api/sourceHealthApi'
import { SourceHealthCard } from './SourceHealthCard'

const backend = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/lib/auth')>()
  return { ...original, api: { ...original.api, get: backend.get } }
})

const ACTIONS = [
  'customer_confirmation',
  'customer_cancellation',
  'merchant_no_reply_cancellation',
  'merchant_cancellation_tagging',
  'automatic_no_reply_tagging',
] as const

function health(overrides: Partial<SourceHealth> = {}): SourceHealth {
  return {
    integrationId: 'int-1',
    platformType: 'easyorders',
    connectionState: 'connected',
    disconnectedAt: null,
    windowDays: 7,
    credentials: { status: 'ok' },
    events: { lastAcceptedAt: null, acceptedCount: 0 },
    processing: { failedCount: 0, lastFailedAt: null },
    backlog: { waitingCount: 0, oldestWaitingAt: null },
    remoteSync: {
      failedCount: 0,
      lastFailedAt: null,
      pendingCount: 0,
      requiresAssistance: false,
    },
    delivery: { secretsMissing: false, rejectedCount: 0, lastRejectedAt: null },
    capabilities: ACTIONS.map((action) => ({ action, supported: false })),
    ...overrides,
  }
}

async function renderCard(data: SourceHealth, locale: 'ar' | 'en' = 'en') {
  backend.get.mockResolvedValue(data)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  )
  const view = render(<SourceHealthCard />, { wrapper })
  await screen.findByText(
    (locale === 'ar' ? ar : en).settings.standalone.page.store.health.lastEvent
      .title
  )
  return view
}

/** The value shown next to a signal's name. */
const valueOf = (title: string) =>
  screen.getByText(title).nextElementSibling as HTMLElement

describe('SourceHealthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the health from the neutral settings route', async () => {
    await renderCard(health())

    expect(backend.get).toHaveBeenCalledWith('/api/settings/source-health', {
      cache: 'no-store',
    })
  })

  it.each([
    [
      'en',
      'No events yet',
      'Nothing is wrong with that by itself: an event arrives when your store gets an order.',
    ],
    [
      'ar',
      'لا أحداث بعد',
      'لا يعني ذلك وجود مشكلة: يصل الحدث عندما يستقبل متجرك طلبًا.',
    ],
  ] as const)(
    'describes a store with no events without flagging it, in %s',
    async (locale, none, note) => {
      const { container } = await renderCard(health(), locale)

      expect(screen.getByText(none)).toBeTruthy()
      expect(screen.getByText(note)).toBeTruthy()
      // Silence is not a fault: nothing alerts and nothing is highlighted.
      expect(screen.queryByRole('alert')).toBeNull()
      expect(container.querySelector('.text-ak-warning')).toBeNull()
    }
  )

  it('keeps the four signals apart, each with its own wording', async () => {
    await renderCard(
      health({
        credentials: { status: 'rejected' },
        events: {
          lastAcceptedAt: '2026-10-03T10:00:00.000Z',
          acceptedCount: 9,
        },
        processing: {
          failedCount: 2,
          lastFailedAt: '2026-10-03T10:05:00.000Z',
        },
        backlog: {
          waitingCount: 3,
          oldestWaitingAt: '2026-10-03T09:30:00.000Z',
        },
        remoteSync: {
          failedCount: 1,
          lastFailedAt: '2026-10-03T10:10:00.000Z',
          pendingCount: 2,
          requiresAssistance: true,
        },
      })
    )

    expect(valueOf('Access to your store').textContent).toBe(
      'Rejected by the store'
    )
    expect(valueOf('Access to your store').className).toContain(
      'text-ak-warning'
    )
    expect(document.body.textContent).toContain(
      'This is the answer the store gave the last time Akeed used its key, not a live check.'
    )
    expect(document.body.textContent).toContain('9 events in the last 7 days.')
    expect(valueOf('Processing failures').textContent).toBe(
      '2 events failed in the last 7 days'
    )
    // Waiting is a fact, not a fault.
    expect(valueOf('Waiting to be processed').textContent).toBe(
      '3 events waiting'
    )
    expect(valueOf('Waiting to be processed').className).not.toContain(
      'text-ak-warning'
    )
    expect(valueOf('Order status updates in your store').textContent).toBe(
      '1 update was not applied in the last 7 days'
    )
    expect(document.body.textContent).toContain(
      '2 updates are still being tried.'
    )
    expect(document.body.textContent).toContain(
      'The confirmation result is kept in Akeed either way.'
    )
  })

  it('makes refused deliveries visible', async () => {
    await renderCard(
      health({
        delivery: {
          secretsMissing: false,
          rejectedCount: 4,
          lastRejectedAt: '2026-10-03T09:00:00.000Z',
        },
      })
    )

    expect(valueOf('Events refused before processing').textContent).toBe(
      '4 events were refused for a wrong webhook secret'
    )
    expect(valueOf('Events refused before processing').className).toContain(
      'text-ak-warning'
    )
  })

  it('says a secret not learned yet is waiting for the first order, without flagging it', async () => {
    await renderCard(
      health({
        delivery: {
          secretsMissing: true,
          rejectedCount: 0,
          lastRejectedAt: null,
        },
      })
    )

    expect(valueOf('Events refused before processing').textContent).toBe(
      'Waiting for the first order to secure the webhooks'
    )
    expect(valueOf('Events refused before processing').className).not.toContain(
      'text-ak-warning'
    )
  })

  it('says which outcomes reach the store and which stay in Akeed', async () => {
    await renderCard(
      health({
        capabilities: ACTIONS.map((action, index) => ({
          action,
          supported: index < 3,
        })),
      })
    )

    expect(document.body.textContent).toContain(
      'Updated in your store: customer confirmations, customer cancellations, cancellations you make after no reply.'
    )
    expect(document.body.textContent).toContain(
      'Kept in Akeed only: cancellation tags, automatic no-reply marks.'
    )
  })

  it('says plainly when nothing is written to the store', async () => {
    await renderCard(health())

    expect(valueOf('What Akeed updates in your store').textContent).toBe(
      'Order status updates are not switched on for this store yet'
    )
    expect(document.body.textContent).toContain(
      'Results are always recorded in Akeed.'
    )
  })

  it('still reports history for a disconnected source, with no credentials', async () => {
    await renderCard(
      health({
        connectionState: 'disconnected',
        credentials: { status: 'removed' },
        events: {
          lastAcceptedAt: '2026-10-02T10:00:00.000Z',
          acceptedCount: 12,
        },
      }),
      'ar'
    )

    expect(document.documentElement.dir).toBe('rtl')
    expect(valueOf('الوصول إلى متجرك').textContent).toBe('أُزيل عند فصل المتجر')
    expect(document.body.textContent).toContain(
      'عدد الأحداث في آخر 7 أيام: 12.'
    )
    expect(valueOf('ما يحدّثه أكيد في متجرك').textContent).toBe(
      'لا شيء ما دام المتجر مفصولًا'
    )
  })

  it('leaves out credential and delivery signals for a source that has none', async () => {
    await renderCard(health({ credentials: null, delivery: null }))

    expect(screen.queryByText('Access to your store')).toBeNull()
    expect(screen.queryByText('Events refused before processing')).toBeNull()
    expect(screen.getByText('Processing failures')).toBeTruthy()
  })

  it('offers a retry when the health cannot be loaded', async () => {
    backend.get.mockRejectedValueOnce(new Error('offline'))
    backend.get.mockResolvedValue(health())
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <QueryClientProvider client={client}>
          <SourceHealthCard />
        </QueryClientProvider>
      </NextIntlClientProvider>
    )

    expect((await screen.findByRole('alert')).textContent).toBe(
      'We couldn’t load the connection health.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('No events yet')).toBeTruthy()
  })
})
