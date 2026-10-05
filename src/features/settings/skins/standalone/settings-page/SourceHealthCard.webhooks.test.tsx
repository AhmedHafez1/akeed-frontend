import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import type { SourceHealth, SourceWebhook } from '../../../api/sourceHealthApi'
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
    platformType: 'woocommerce',
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

const withWebhooks = (items: SourceWebhook[]) =>
  health({ webhooks: { checkedAt: '2026-10-05T09:00:00.000Z', items } })

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

/** The value shown next to a signal's name, and its note. */
const valueOf = (title: string) =>
  screen.getByText(title).nextElementSibling as HTMLElement
const noteOf = (title: string) =>
  valueOf(title).nextElementSibling as HTMLElement

/** Each webhook's state, as the store answered (US-07-05). */
describe('SourceHealthCard webhook state', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows each webhook as its own signal, next to the others and with no overall verdict', async () => {
    const { container } = await renderCard(
      withWebhooks([
        { kind: 'order_created', state: 'active' },
        { kind: 'order_updated', state: 'disabled' },
      ])
    )

    expect(valueOf('Notification for new orders').textContent).toBe('Active')
    expect(valueOf('Notification for order changes').textContent).toBe(
      'Disabled by your store'
    )
    // The other facts are still there, each on its own row.
    expect(valueOf('Access to your store').textContent).toBe('Accepted')
    expect(valueOf('Last order event received').textContent).toBe(
      'No events yet'
    )
    expect(container.textContent).not.toMatch(/healthy|all good|unhealthy/i)
  })

  it('flags a disabled webhook and says missed orders are not imported', async () => {
    await renderCard(
      withWebhooks([
        { kind: 'order_created', state: 'active' },
        { kind: 'order_updated', state: 'disabled' },
      ])
    )

    const disabled = valueOf('Notification for order changes')
    expect(disabled.className).toContain('text-ak-warning')
    expect(noteOf('Notification for order changes').textContent).toBe(
      'Re-enable it under Connection above. Orders placed while it was disabled are not imported.'
    )
    expect(valueOf('Notification for new orders').className).not.toContain(
      'text-ak-warning'
    )
  })

  it.each([
    [
      'paused',
      'Paused in your store',
      'Akeed doesn’t change this. Activate it in your store’s webhook settings.',
      false,
    ],
    [
      'missing',
      'Deleted from your store',
      'Disconnect, then connect the same store again to restore it.',
      true,
    ],
    [
      'unknown',
      'Couldn’t be read from your store',
      'Your store didn’t answer, or didn’t accept Akeed’s access. That is not by itself a fault of the notification.',
      false,
    ],
  ] as const)(
    'describes a webhook that is %s',
    async (state, value, note, attention) => {
      await renderCard(
        withWebhooks([
          { kind: 'order_created', state },
          { kind: 'order_updated', state: 'active' },
        ])
      )

      const shown = valueOf('Notification for new orders')
      expect(shown.textContent).toBe(value)
      expect(noteOf('Notification for new orders').textContent).toBe(note)
      expect(shown.className.includes('text-ak-warning')).toBe(attention)
    }
  )

  it('does not treat a store with no recent events as a fault of its webhooks', async () => {
    await renderCard(
      withWebhooks([
        { kind: 'order_created', state: 'active' },
        { kind: 'order_updated', state: 'active' },
      ])
    )

    expect(valueOf('Last order event received').className).not.toContain(
      'text-ak-warning'
    )
    expect(
      screen.getByText(
        'Nothing is wrong with that by itself: an event arrives when your store gets an order.'
      )
    ).toBeTruthy()
  })

  it('shows the same in Arabic, right to left', async () => {
    await renderCard(
      withWebhooks([
        { kind: 'order_created', state: 'active' },
        { kind: 'order_updated', state: 'disabled' },
      ]),
      'ar'
    )

    expect(document.documentElement.dir).toBe('rtl')
    expect(valueOf('إشعار الطلبات الجديدة').textContent).toBe('مفعّل')
    expect(valueOf('إشعار تغييرات الطلبات').textContent).toBe('عطّله متجرك')
    expect(noteOf('إشعار تغييرات الطلبات').textContent).toContain(
      'الطلبات التي أُنشئت أثناء تعطيله لا تُستورد.'
    )
  })

  it.each([
    [
      'a source whose store cannot be asked',
      health({ platformType: 'easyorders' }),
    ],
    [
      'a disconnected source',
      health({
        connectionState: 'disconnected',
        credentials: { status: 'removed' },
      }),
    ],
  ])('shows no webhook rows for %s', async (_label, data) => {
    const { container } = await renderCard(data)

    expect(screen.queryByText('Notification for new orders')).toBeNull()
    expect(container.textContent).not.toContain('Notification for')
  })
})
