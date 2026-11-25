import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import type {
  NeedsActionItem,
  ShippingFailureReason,
  ShippingSummary,
  VerificationItem,
} from '../model/dashboard.model'
import { ConfirmationsCardList } from './embedded/components/confirmations/ConfirmationsCardList'
import { ConfirmationsTable } from './embedded/components/confirmations/ConfirmationsTable'
import { ConfirmationDetailsModal } from './embedded/components/confirmations/ConfirmationDetailsModal'
import { NeedsActionCard as EmbeddedNeedsActionCard } from './embedded/components/overview/NeedsActionCard'
import { renderEmbedded } from './embedded/components/embeddedTestUtils'
import { ConfirmationsList } from './standalone/components/confirmations/ConfirmationsList'
import { VerificationDetailsSheet } from './standalone/components/confirmations/VerificationDetailsSheet'
import { NeedsActionCard as StandaloneNeedsActionCard } from './standalone/components/overview/NeedsActionCard'
import { renderStandalone } from './standalone/components/shared/standaloneTestUtils'

const auth = vi.hoisted(() => ({ post: vi.fn() }))
const toast = vi.hoisted(() => ({ show: vi.fn() }))

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/lib/auth')>()
  return { ...original, api: { ...original.api, post: auth.post } }
})

vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({
    mode: 'EMBEDDED',
    isEmbedded: true,
    isStandalone: false,
    isLoading: false,
    shopify: { toast },
  }),
}))

/** Embedded rendering with a query client, which "Mark done" needs. */
function renderEmbeddedWithQueries(ui: ReactElement, lang: 'ar' | 'en' = 'ar') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return renderEmbedded(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    lang
  )
}

function shipping(overrides: Partial<ShippingSummary> = {}): ShippingSummary {
  return {
    status: 'sent',
    reason_code: null,
    trigger: 'fulfillment',
    matched_tag: null,
    tracking_number: null,
    tracking_url: null,
    customer_reply: null,
    customer_replied_at: null,
    delivery_request: false,
    resolved_at: null,
    updated_at: '2026-11-25T12:20:00Z',
    ...overrides,
  }
}

function listRow(overrides: Partial<VerificationItem> = {}): VerificationItem {
  return {
    id: 'v-1',
    status: 'confirmed',
    reason: null,
    order_id: 'o-1',
    order_number: '1187',
    is_test: false,
    customer_name: 'Mona Adel',
    customer_phone: '+201001234567',
    total_price: '1250',
    currency: 'EGP',
    created_at: '2026-11-25T11:52:00Z',
    last_sent_at: '2026-11-25T11:52:00Z',
    delivered_at: null,
    read_at: null,
    confirmed_at: '2026-11-25T12:00:00Z',
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    platform: 'shopify',
    external_order_id: '5551187',
    updated_at: '2026-11-25T12:20:00Z',
    ...overrides,
  }
}

const handlers = {
  onOpenDetails: vi.fn(),
  onRequestConfirm: vi.fn(),
  onRequestCancel: vi.fn(),
  onRetry: vi.fn(),
  onToggleAutoCancel: vi.fn(),
}
const listProps = {
  timeZone: 'UTC',
  canWrite: true,
  canRetry: true,
  actingId: null,
  handlers,
}

const REASONS: [
  ShippingFailureReason,
  'undeliverable' | 'failedToSend' | 'notSent',
][] = [
  ['no_phone', 'undeliverable'],
  ['not_on_whatsapp', 'undeliverable'],
  ['no_allowance', 'failedToSend'],
  ['send_failed', 'failedToSend'],
  ['template_unavailable', 'failedToSend'],
  ['order_too_old', 'notSent'],
  ['order_cancelled', 'notSent'],
]

const failed = (reason: ShippingFailureReason) =>
  listRow({
    id: `v-${reason}`,
    shipping: shipping({ status: 'failed', reason_code: reason }),
  })

beforeEach(() => {
  vi.clearAllMocks()
  auth.post.mockResolvedValue({ resolvedAt: '2026-11-25T13:00:00Z' })
})

describe('Shipping column, Shopify table', () => {
  it('is absent while the feature is off', () => {
    renderEmbedded(
      <ConfirmationsTable
        rows={[listRow({ shipping: shipping() })]}
        {...listProps}
      />,
      'en'
    )
    expect(screen.queryByRole('columnheader', { name: 'Shipping' })).toBeNull()
    expect(screen.queryByText(en.dashboard.shipping.badges.sent)).toBeNull()
  })

  it('shows Sent with its time, and nothing while pending or not due', () => {
    renderEmbedded(
      <ConfirmationsTable
        rows={[
          listRow({ id: 'a', shipping: shipping({ status: 'delivered' }) }),
          listRow({ id: 'b', shipping: shipping({ status: 'pending' }) }),
          listRow({ id: 'c', shipping: null }),
        ]}
        showShipping
        {...listProps}
      />,
      'en'
    )
    expect(screen.getByRole('columnheader', { name: 'Shipping' })).toBeTruthy()
    const sent = screen.getAllByText('Sent')
    // The Reminder column is empty here, so every "Sent" is Shipping's.
    expect(sent).toHaveLength(1)
    expect(sent[0].closest('[title]')?.getAttribute('title')).toBe(
      'Nov 25, 2026, 12:20 PM'
    )
  })

  it.each(REASONS)(
    'words %s as %s with the reason on hover and for screen readers',
    (reason, badge) => {
      renderEmbedded(
        <ConfirmationsTable
          rows={[failed(reason)]}
          showShipping
          {...listProps}
        />,
        'en'
      )
      const text = en.dashboard.shipping.reasons[reason]
      const word = screen.getByText(en.dashboard.shipping.badges[badge])
      expect(word.closest('[title]')?.getAttribute('title')).toBe(text)
      expect(screen.getByText(text).className).toContain('sr-only')
    }
  )

  it('keeps the Arabic cell on one line', () => {
    renderEmbedded(
      <ConfirmationsTable
        rows={[failed('not_on_whatsapp')]}
        showShipping
        {...listProps}
      />
    )
    const badge = screen.getByText(ar.dashboard.shipping.badges.undeliverable)
    expect(badge.closest('[title]')?.className).toContain('whitespace-nowrap')
  })

  it('gives the phone card its own labelled Shipping line, kept on one line', () => {
    renderEmbedded(
      <ConfirmationsCardList
        rows={[failed('send_failed')]}
        showShipping
        {...listProps}
      />
    )
    const badge = screen.getByText(ar.dashboard.shipping.badges.failedToSend)
    const line = badge.closest('[title]') as HTMLElement
    expect(line.className).toContain('whitespace-nowrap')
    expect(within(line).getByText(ar.dashboard.shipping.heading)).toBeTruthy()
    // Not squeezed beside the status, which keeps its own slot.
    expect(
      within(line).queryByText(ar.dashboard.confirmations.status.confirmed)
    ).toBeNull()
  })

  it('does not repeat "WhatsApp undeliverable" on a card whose status says it', () => {
    renderEmbedded(
      <ConfirmationsCardList
        rows={[
          listRow({
            action_reason: 'shipping_not_reachable',
            shipping: shipping({
              status: 'failed',
              reason_code: 'not_on_whatsapp',
            }),
          }),
        ]}
        showShipping
        {...listProps}
      />
    )
    expect(
      screen.getAllByText(ar.dashboard.shipping.badges.undeliverable)
    ).toHaveLength(1)
    expect(screen.queryByText(ar.dashboard.shipping.heading)).toBeNull()
  })
})

describe('Shipping column, standalone table', () => {
  const props = {
    ...listProps,
    hasMore: false,
    isLoadingMore: false,
    onLoadMore: vi.fn(),
    loadedLabel: '',
  }

  it('is absent while the feature is off, and the table keeps its width', () => {
    renderStandalone(
      <ConfirmationsList rows={[failed('send_failed')]} {...props} />,
      'en'
    )
    expect(screen.queryByRole('columnheader', { name: 'Shipping' })).toBeNull()
    expect(screen.getByRole('table').className).toContain('min-w-300')
  })

  it.each(REASONS)(
    'words %s as %s with the reason in its title',
    (reason, badge) => {
      renderStandalone(
        <ConfirmationsList rows={[failed(reason)]} showShipping {...props} />,
        'en'
      )
      const table = within(screen.getByRole('table'))
      expect(table.getByRole('columnheader', { name: 'Shipping' })).toBeTruthy()
      const word = table.getByText(en.dashboard.shipping.badges[badge])
      expect(word.closest('[title]')?.getAttribute('title')).toBe(
        en.dashboard.shipping.reasons[reason]
      )
    }
  )

  it('widens the table and keeps the Arabic cell on one line', () => {
    renderStandalone(
      <ConfirmationsList rows={[failed('no_phone')]} showShipping {...props} />
    )
    const table = screen.getByRole('table')
    expect(table.className).toContain('min-w-340')
    const badge = within(table)
      .getByText(ar.dashboard.shipping.badges.undeliverable)
      .closest('[title]') as HTMLElement
    expect(badge.className).toContain('whitespace-nowrap')
    expect(badge.parentElement?.className).toContain('whitespace-nowrap')
  })
})

describe('Shipping section in the details', () => {
  const request = listRow({
    action_reason: 'delivery_request',
    shipping: shipping({
      status: 'read',
      trigger: 'tag',
      matched_tag: 'Bosta',
      tracking_number: '1Z999AA10123456784',
      tracking_url: 'https://track.example/1Z999',
      customer_reply: 'address',
      customer_replied_at: '2026-11-25T12:30:00Z',
      delivery_request: true,
    }),
  })

  it('shows why it was sent, its status, tracking and the reply, and marks it done (Shopify)', async () => {
    renderEmbeddedWithQueries(
      <ConfirmationDetailsModal
        verification={request}
        timeZone="UTC"
        onClose={vi.fn()}
        canAct
      />,
      'en'
    )
    const copy = en.dashboard.shipping
    expect(screen.getByText(copy.details.title)).toBeTruthy()
    expect(screen.getByText('Tag “Bosta”')).toBeTruthy()
    expect(screen.getByText(copy.details.status.read)).toBeTruthy()
    expect(screen.getByText('1Z999AA10123456784')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: copy.details.track })
        .getAttribute('href')
    ).toBe('https://track.example/1Z999')
    expect(screen.getByText(copy.details.replies.address)).toBeTruthy()
    expect(
      screen.getByText(new RegExp(copy.details.requestAddress))
    ).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: copy.markDone }))
    })
    expect(auth.post).toHaveBeenCalledWith(
      '/api/verifications/v-1/shipping/resolve',
      {}
    )
    expect(toast.show).toHaveBeenCalledWith(copy.markedDone)
  })

  it('offers no Mark done to a viewer (Shopify)', () => {
    renderEmbeddedWithQueries(
      <ConfirmationDetailsModal
        verification={request}
        timeZone="UTC"
        onClose={vi.fn()}
      />,
      'en'
    )
    expect(
      screen.getByText(new RegExp(en.dashboard.shipping.details.requestAddress))
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: en.dashboard.shipping.markDone })
    ).toBeNull()
  })

  it('never links a tracking address that is not https', () => {
    renderEmbedded(
      <ConfirmationDetailsModal
        verification={listRow({
          shipping: shipping({
            tracking_number: '42',
            tracking_url: 'javascript:alert(1)',
          }),
        })}
        timeZone="UTC"
        onClose={vi.fn()}
      />,
      'en'
    )
    expect(screen.getByText('42')).toBeTruthy()
    expect(
      screen.queryByRole('link', { name: en.dashboard.shipping.details.track })
    ).toBeNull()
  })

  it('writes out why it was not sent, and shows nothing without a Shipped message', () => {
    const { unmount } = renderEmbedded(
      <ConfirmationDetailsModal
        verification={failed('no_allowance')}
        timeZone="UTC"
        onClose={vi.fn()}
      />
    )
    expect(
      screen.getByText(ar.dashboard.shipping.badges.failedToSend)
    ).toBeTruthy()
    expect(
      screen.getByText(ar.dashboard.shipping.reasons.no_allowance)
    ).toBeTruthy()
    unmount()
    renderEmbedded(
      <ConfirmationDetailsModal
        verification={listRow()}
        timeZone="UTC"
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByText(ar.dashboard.shipping.details.title)).toBeNull()
  })

  it('shows the same section in the standalone sheet, with Mark done for writers', async () => {
    renderStandalone(
      <VerificationDetailsSheet
        verification={request}
        timeZone="UTC"
        onClose={vi.fn()}
        canActOnChangeRequest
      />
    )
    const copy = ar.dashboard.shipping
    const section = within(
      screen.getByRole('region', { name: copy.details.title })
    )
    expect(section.getByText(copy.details.requestAddress)).toBeTruthy()
    expect(section.getByText(copy.details.replies.address)).toBeTruthy()
    await act(async () => {
      fireEvent.click(section.getByRole('button', { name: copy.markDone }))
    })
    expect(auth.post).toHaveBeenCalledWith(
      '/api/verifications/v-1/shipping/resolve',
      {}
    )
  })
})

describe('Needs your action after shipping', () => {
  const item = (overrides: Partial<NeedsActionItem> = {}): NeedsActionItem => ({
    verification_id: 'v-1187',
    order_id: 'o-1187',
    external_order_id: '5551187',
    platform: 'shopify',
    order_number: '1187',
    customer_name: 'Mona Adel',
    customer_phone: '+201001234567',
    total_price: '1250',
    currency: 'EGP',
    created_at: '2026-11-25T11:52:00Z',
    updated_at: '2026-11-25T12:30:00Z',
    reason: {
      type: 'delivery_request',
      since: '2026-11-25T12:20:00Z',
      hours: null,
      failure_code: null,
    },
    capabilities: [],
    shipping: shipping({
      delivery_request: true,
      customer_reply: 'reschedule',
      customer_replied_at: '2026-11-25T12:30:00Z',
    }),
    ...overrides,
  })
  const notReached = item({
    verification_id: 'v-1185',
    order_number: '1185',
    reason: {
      type: 'shipping_not_reachable',
      since: null,
      hours: null,
      failure_code: null,
    },
    shipping: shipping({ status: 'failed', reason_code: 'not_on_whatsapp' }),
  })
  const embeddedProps = {
    timeZone: 'UTC',
    onOpenDetails: vi.fn(),
    onRequestConfirm: vi.fn(),
    onViewAll: vi.fn(),
    onHandle: vi.fn(),
  }

  it('labels the request and the unreached customer, with Mark done (Shopify)', async () => {
    renderEmbeddedWithQueries(
      <EmbeddedNeedsActionCard
        needsAction={{ count: 2, items: [item(), notReached] }}
        canConfirm
        {...embeddedProps}
      />,
      'en'
    )
    const copy = en.dashboard
    expect(screen.getByText(copy.confirmations.status.reschedule)).toBeTruthy()
    expect(screen.getByText(copy.confirmations.status.noWhatsApp)).toBeTruthy()
    expect(
      screen.getByText(copy.overview.needsAction.reason.shipping_not_reachable)
    ).toBeTruthy()
    const buttons = screen.getAllByRole('button', {
      name: copy.shipping.markDone,
    })
    expect(buttons).toHaveLength(2)
    await act(async () => {
      fireEvent.click(buttons[0])
    })
    expect(auth.post).toHaveBeenCalledWith(
      '/api/verifications/v-1187/shipping/resolve',
      {}
    )
  })

  it('hides Mark done from a viewer (Shopify)', () => {
    renderEmbeddedWithQueries(
      <EmbeddedNeedsActionCard
        needsAction={{ count: 1, items: [item()] }}
        canConfirm={false}
        {...embeddedProps}
      />,
      'en'
    )
    expect(
      screen.getByText(en.dashboard.confirmations.status.reschedule)
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: en.dashboard.shipping.markDone })
    ).toBeNull()
  })

  it('labels a change of address in Arabic in the standalone card', () => {
    renderStandalone(
      <StandaloneNeedsActionCard
        needsAction={{
          count: 1,
          items: [
            item({
              shipping: shipping({
                delivery_request: true,
                customer_reply: 'address',
              }),
            }),
          ],
        }}
        timeZone="UTC"
        canConfirm
        onRequestConfirm={vi.fn()}
        onRequestCancel={vi.fn()}
        viewAllHref="/ar/verifications"
        handleHref={(id) => `/ar/verifications?open=${id}`}
      />
    )
    expect(
      screen.getAllByText(ar.dashboard.confirmations.status.changeAddress)
        .length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: ar.dashboard.shipping.markDone })
        .length
    ).toBeGreaterThan(0)
  })
})
