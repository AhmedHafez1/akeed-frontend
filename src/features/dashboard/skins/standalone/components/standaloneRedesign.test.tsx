import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import type {
  ConfirmationsTab,
  DashboardOverview,
} from '@/features/dashboard/model/dashboard.model'
import { ConfirmationsToolbar } from './confirmations/ConfirmationsToolbar'
import { MessageFlowCard } from './overview/MessageFlowCard'
import { NeedsActionCard } from './overview/NeedsActionCard'
import { StatusBadge } from './shared/StatusBadge'
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

  it('names the wait and the reminder in English', () => {
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
    expect(screen.getByText('Reminder sent Sep 27')).toBeTruthy()
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
