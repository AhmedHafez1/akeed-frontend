import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import type {
  ConfirmationsTab,
  DashboardOverview,
  VerificationItem,
} from '@/features/dashboard/model/dashboard.model'
import {
  FollowUpCell,
  OrderCell,
  StatusCell,
} from './confirmations/confirmationCells'
import { ConfirmationsList } from './confirmations/ConfirmationsList'
import { ConfirmationsToolbar } from './confirmations/ConfirmationsToolbar'
import { MessageFlowCard } from './overview/MessageFlowCard'
import { NeedsActionCard } from './overview/NeedsActionCard'
import { StatusBadge } from '@/shared/ui/status-badge'
import { renderStandalone } from './shared/standaloneTestUtils'

const counts: Record<ConfirmationsTab, number> = {
  all: 38,
  needs_action: 2,
  confirmed: 18,
  canceled: 4,
  failed: 0,
}

function renderToolbar(onTabChange = vi.fn()) {
  renderStandalone(
    <ConfirmationsToolbar
      tab="all"
      tabCounts={counts}
      onTabChange={onTabChange}
      panelId="panel"
      tabIdPrefix="tabs"
      searchInput=""
      isSearchValid
      onSearchChange={vi.fn()}
      onSearchClear={vi.fn()}
    />,
    'en'
  )
  return onTabChange
}

describe('ConfirmationsToolbar', () => {
  it('exposes real tabs with the selection and hides zero counts', () => {
    renderToolbar()
    const tabs = screen.getAllByRole('tab')
    expect(screen.getByRole('tablist')).toBeTruthy()
    expect(tabs).toHaveLength(5)
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[0].getAttribute('aria-controls')).toBe('panel')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
    expect(tabs[1].textContent).toBe('Needs action2')
    // "Failed to send" has no rows, so no bubble.
    expect(tabs[4].textContent).toBe('Failed to send')
  })

  it('moves with the arrow keys and focuses search on "/"', () => {
    const onTabChange = renderToolbar()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(onTabChange).toHaveBeenCalledWith('needs_action')
    fireEvent.keyDown(document.body, { key: '/' })
    expect(document.activeElement).toBe(screen.getByRole('searchbox'))
  })
})

describe('OrderCell', () => {
  it('truncates long order numbers visually and keeps the full label available', () => {
    const orderLabel = '#AKEED-TEST-1789293921'
    renderStandalone(
      <OrderCell orderLabel={orderLabel} isTest onOpen={vi.fn()} />,
      'en'
    )

    const orderButton = screen.getByRole('button', {
      name: `Open details for order ${orderLabel}`,
    })
    expect(orderButton.getAttribute('title')).toBe(orderLabel)
    expect(orderButton.className).toContain('max-w-[10ch]')
    expect(screen.getByText('Test')).toBeTruthy()
  })
})

describe('StatusCell', () => {
  it('shows the current status timestamp on the badge', () => {
    const row = {
      status: 'confirmed',
      confirmed_at: '2026-09-16T07:00:00Z',
    } as VerificationItem
    renderStandalone(<StatusCell row={row} timeZone="UTC" />, 'en')

    expect(
      screen.getByText('Confirmed').closest('[title]')?.getAttribute('title')
    ).toBe('Sep 16, 2026, 7:00 AM')
  })

  it('does not show a tooltip when the status has no lifecycle timestamp', () => {
    const row = { status: 'failed' } as VerificationItem
    renderStandalone(<StatusCell row={row} timeZone="UTC" />, 'en')

    expect(screen.getByText(/failed/i).closest('[title]')).toBeNull()
  })

  it('names an escalated order "No reply", the same word as the Shopify table', () => {
    const row = {
      status: 'no_reply',
      action_reason: 'no_reply_after_follow_up',
      follow_up_sent_at: '2026-09-28T10:00:00Z',
      is_test: false,
    } as VerificationItem
    renderStandalone(<StatusCell row={row} timeZone="UTC" />, 'en')

    expect(screen.getByText('No reply')).toBeTruthy()
    expect(screen.queryByText('Reminder sent')).toBeNull()
    expect(screen.queryByText('Needs action')).toBeNull()
  })

  it('shows the follow-up timestamp on a sent badge and nothing when unsent', () => {
    const sentRow = {
      status: 'no_reply',
      follow_up_sent_at: '2026-09-28T10:00:00Z',
    } as VerificationItem
    const { unmount } = renderStandalone(
      <FollowUpCell row={sentRow} timeZone="UTC" showTime />,
      'en'
    )

    expect(screen.getByText('Sent').parentElement?.getAttribute('title')).toBe(
      'Sep 28, 2026, 10:00 AM'
    )
    expect(screen.getByText('Sep 28 · 10:00 AM')).toBeTruthy()
    unmount()
    renderStandalone(
      <FollowUpCell
        row={{ ...sentRow, follow_up_sent_at: null }}
        timeZone="UTC"
      />,
      'en'
    )
    expect(screen.queryByText('Sent')).toBeNull()
  })
})

describe('ConfirmationsList', () => {
  it('shows name and phone in separate single-line table cells', () => {
    const row = {
      id: 'v-1',
      status: 'confirmed',
      reason: null,
      order_id: 'o-1',
      order_number: '1137',
      is_test: false,
      customer_name: 'Ahmed Zaid',
      customer_phone: '+201148675077',
      total_price: '49.95',
      currency: 'USD',
      last_sent_at: '2026-09-16T06:49:00Z',
      delivered_at: null,
      read_at: null,
      confirmed_at: '2026-09-16T07:00:00Z',
      canceled_at: null,
      expired_at: null,
      no_reply_at: null,
      follow_up_attempts: 0,
      created_at: '2026-09-16T06:49:00Z',
      updated_at: '2026-09-16T06:49:00Z',
      follow_up_sent_at: null,
      optimistic: 'queued',
    } as VerificationItem
    renderStandalone(
      <ConfirmationsList
        rows={[row, { ...row, id: 'v-2', customer_name: null }]}
        timeZone="UTC"
        canWrite
        canRetry
        actingId={null}
        handlers={{
          onOpenDetails: vi.fn(),
          onRequestConfirm: vi.fn(),
          onRequestCancel: vi.fn(),
          onRetry: vi.fn(),
        }}
      />,
      'en'
    )

    const table = screen.getByRole('table')
    expect(
      within(table).getByRole('columnheader', { name: 'Phone' })
    ).toBeTruthy()
    const tableRows = within(table).getAllByRole('row')
    const namedCells = within(tableRows[1]).getAllByRole('cell')
    const namelessCells = within(tableRows[2]).getAllByRole('cell')
    expect(namedCells[1].textContent).toBe('Ahmed Zaid')
    expect(namedCells[2].textContent).toBe('+20 114 867 5077')
    expect(namelessCells[1].textContent).toBe('No name')
    expect(namelessCells[2].textContent).toBe('+20 114 867 5077')
    expect(namedCells[1].querySelectorAll('p')).toHaveLength(0)

    expect(
      screen.queryByRole('columnheader', { name: 'Last update' })
    ).toBeNull()
    expect(screen.queryByText(/Sep 16/)).toBeNull()
  })
})

describe('NeedsActionCard', () => {
  const needsAction = {
    count: 2,
    items: [
      {
        verification_id: 'v1',
        order_id: 'o1',
        external_order_id: null,
        platform: null,
        order_number: 'EG-2032',
        customer_name: 'أحمد تامر',
        customer_phone: '+201148675077',
        total_price: '751',
        currency: 'EGP',
        reason: {
          type: 'no_reply_after_follow_up',
          since: '2026-09-27T10:00:00Z',
          hours: 26,
          failure_code: null,
        },
        capabilities: [
          { action: 'merchant_manual_confirmation', supported: true },
          { action: 'merchant_no_reply_cancellation', supported: true },
        ],
      },
    ],
  } as DashboardOverview['needs_action']

  it('uses the Arabic dual for two orders and puts the currency after', () => {
    renderStandalone(
      <NeedsActionCard
        needsAction={needsAction}
        timeZone="UTC"
        canConfirm
        onRequestConfirm={vi.fn()}
        onRequestCancel={vi.fn()}
        viewAllHref="/ar/verifications"
      />
    )
    expect(screen.getByText('طلبان')).toBeTruthy()
    expect(screen.getByText('لم يرد · يوم')).toBeTruthy()
    expect(screen.getByText('751.00 ج.م.')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'إجراءات أخرى للطلب #EG-2032' })
    ).toBeTruthy()
  })

  it('names the wait without the reminder date in English', () => {
    renderStandalone(
      <NeedsActionCard
        needsAction={needsAction}
        timeZone="UTC"
        canConfirm
        onRequestConfirm={vi.fn()}
        onRequestCancel={vi.fn()}
        viewAllHref="/en/verifications"
      />,
      'en'
    )
    expect(screen.getByText('2 orders')).toBeTruthy()
    expect(screen.getByText('No reply · 1 day')).toBeTruthy()
    expect(screen.queryByText('Reminder sent Sep 27')).toBeNull()
    expect(
      screen.queryByText(
        'No reply after the reminder. Message them yourself or confirm on their behalf.'
      )
    ).toBeNull()
    expect(screen.getByRole('button', { name: /Confirm order/ })).toBeTruthy()
  })
})

describe('MessageFlowCard', () => {
  const funnel = {
    sent: { count: 23, percent_of_sent: 100 },
    delivered: { count: 23, percent_of_sent: 100 },
    read: { count: 19, percent_of_sent: 82.6 },
    replied: { count: 19, percent_of_sent: 82.6 },
    confirmed: 15,
    customer_canceled: 4,
    no_reply_yet: 4,
  } as DashboardOverview['funnel']

  it('ends the legend with the manual confirmations', () => {
    renderStandalone(
      <MessageFlowCard funnel={funnel} manualConfirmed={2} />,
      'en'
    )
    const legend = screen.getByRole('list', { name: 'Replies by outcome' })
    expect(within(legend).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('2 more confirmed manually')).toBeTruthy()
  })

  it('leaves the note out when nothing was confirmed by hand', () => {
    renderStandalone(
      <MessageFlowCard funnel={funnel} manualConfirmed={0} />,
      'en'
    )
    expect(screen.queryByText(/confirmed manually/)).toBeNull()
  })
})

describe('StatusBadge', () => {
  it('always pairs the word with an icon', () => {
    renderStandalone(<StatusBadge kind="canceled">Canceled</StatusBadge>, 'en')
    const badge = screen.getByText('Canceled').parentElement!
    expect(badge.querySelector('svg')).toBeTruthy()
  })
})
