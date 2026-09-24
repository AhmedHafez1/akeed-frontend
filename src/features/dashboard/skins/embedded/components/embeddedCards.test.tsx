import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import type {
  DashboardOverview,
  NeedsActionItem,
  VerificationItem,
} from '../../../model/dashboard.model'
import { CreditsBar } from './overview/CreditsBar'
import { KpiCards } from './overview/KpiCards'
import { MessageFlowCard } from './overview/MessageFlowCard'
import { NeedsActionCard } from './overview/NeedsActionCard'
import { SettingsStatusLine } from './overview/SettingsStatusLine'
import { ConfirmationsTable } from './confirmations/ConfirmationsTable'
import { renderEmbedded } from './embeddedTestUtils'

const confirmCapability = [
  { action: 'merchant_manual_confirmation' as const, supported: true },
]

function item(overrides: Partial<NeedsActionItem> = {}): NeedsActionItem {
  return {
    verification_id: 'v-1138',
    order_id: 'o-1138',
    external_order_id: '5551138',
    platform: 'shopify',
    order_number: '1138',
    customer_name: 'Abdelghany Hafez',
    customer_phone: '+201007611456',
    total_price: '2629.95',
    currency: 'USD',
    reason: {
      type: 'no_reply_after_follow_up',
      since: '2026-09-22T10:00:00Z',
      hours: 48,
      failure_code: null,
    },
    capabilities: confirmCapability,
    ...overrides,
  }
}

describe('NeedsActionCard', () => {
  const props = {
    timeZone: 'UTC',
    canConfirm: true,
    onRequestConfirm: vi.fn(),
    onViewAll: vi.fn(),
  }

  it('shows a positive empty state instead of an empty table', () => {
    renderEmbedded(
      <NeedsActionCard needsAction={{ count: 0, items: [] }} {...props} />
    )
    expect(screen.getByText('لا توجد طلبات تحتاج إجراء')).toBeTruthy()
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('lists each order with its reason, total and actions', () => {
    const onRequestConfirm = vi.fn()
    renderEmbedded(
      <NeedsActionCard
        needsAction={{ count: 1, items: [item()] }}
        {...props}
        onRequestConfirm={onRequestConfirm}
      />
    )
    const row = screen.getByRole('listitem')
    expect(within(row).getByText('#1138')).toBeTruthy()
    expect(
      within(row).getByText('لم يرد منذ 22 سبتمبر · أُرسل التذكير')
    ).toBeTruthy()
    expect(within(row).getByText('US$ 2,629.95')).toBeTruthy()

    const chat = within(row).getByRole('link', { name: /واتساب/ })
    expect(chat.getAttribute('href')).toBe('https://wa.me/201007611456')
    expect(chat.getAttribute('target')).toBe('_blank')

    fireEvent.click(within(row).getByRole('button', { name: /يدوياً/ }))
    expect(onRequestConfirm).toHaveBeenCalledWith({
      verificationId: 'v-1138',
      orderLabel: '#1138',
    })
  })

  it('explains a failed delivery and offers no WhatsApp chat', () => {
    renderEmbedded(
      <NeedsActionCard
        needsAction={{
          count: 1,
          items: [
            item({
              customer_name: null,
              reason: {
                type: 'delivery_failed',
                since: null,
                hours: null,
                failure_code: '131026',
              },
            }),
          ],
        }}
        {...props}
      />
    )
    expect(
      screen.getByText('لم تصل الرسالة: الرقم غير مسجل على واتساب')
    ).toBeTruthy()
    expect(screen.getByText('+20 100 761 1456')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /واتساب/ })).toBeNull()
  })

  it('hides manual confirmation from viewers', () => {
    renderEmbedded(
      <NeedsActionCard
        needsAction={{ count: 1, items: [item()] }}
        {...props}
        canConfirm={false}
      />,
      'en'
    )
    expect(screen.queryByRole('button', { name: /manually/i })).toBeNull()
    expect(
      screen.getByText('No reply since Sep 22 · Reminder sent')
    ).toBeTruthy()
  })
})

const funnel: DashboardOverview['funnel'] = {
  sent: { count: 28, percent_of_sent: 100 },
  delivered: { count: 27, percent_of_sent: 96.4 },
  read: { count: 25, percent_of_sent: 89.3 },
  replied: { count: 25, percent_of_sent: 89.3 },
  confirmed: 19,
  customer_canceled: 6,
  no_reply_yet: 3,
}

describe('MessageFlowCard', () => {
  it('shows each step with its share of sent and the outcome legend', () => {
    renderEmbedded(<MessageFlowCard funnel={funnel} />)
    expect(screen.getByText('وصلت')).toBeTruthy()
    expect(screen.getByText('96%', { exact: false })).toBeTruthy()
    expect(screen.getByText('أكّد 19')).toBeTruthy()
    expect(screen.getByText('ألغى 6')).toBeTruthy()
    expect(screen.getByText('لم يرد بعد 3')).toBeTruthy()
  })

  it('says so when nothing was sent', () => {
    renderEmbedded(
      <MessageFlowCard
        funnel={{
          ...funnel,
          sent: { count: 0, percent_of_sent: null },
          delivered: { count: 0, percent_of_sent: null },
          read: { count: 0, percent_of_sent: null },
          replied: { count: 0, percent_of_sent: null },
          confirmed: 0,
          customer_canceled: 0,
          no_reply_yet: 0,
        }}
      />,
      'en'
    )
    expect(
      screen.getByText('No messages sent in this period yet.')
    ).toBeTruthy()
  })
})

describe('CreditsBar', () => {
  it('stays hidden below 80%', () => {
    const { container } = renderEmbedded(
      <CreditsBar
        usage={{ used: 20, limit: 30, percent: 66, state: 'ok' }}
        onChoosePlan={vi.fn()}
      />
    )
    expect(container.textContent).toBe('')
  })

  it('warns from 80% and critically at the limit', () => {
    const onChoosePlan = vi.fn()
    renderEmbedded(
      <CreditsBar
        usage={{ used: 27, limit: 30, percent: 90, state: 'warning' }}
        onChoosePlan={onChoosePlan}
      />
    )
    expect(screen.getByRole('status').textContent).toContain(
      'استخدمت 27 من 30 رسالة'
    )
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '27'
    )
    fireEvent.click(screen.getByRole('button', { name: 'اختر باقة' }))
    expect(onChoosePlan).toHaveBeenCalled()
  })

  it('announces that confirmations stopped at 100%', () => {
    renderEmbedded(
      <CreditsBar
        usage={{ used: 30, limit: 30, percent: 100, state: 'exhausted' }}
        onChoosePlan={vi.fn()}
      />,
      'en'
    )
    expect(screen.getByRole('alert').textContent).toContain(
      'Confirmations have stopped'
    )
  })
})

describe('KpiCards', () => {
  it('shows the confirmed value as an LTR amount and the rate breakdown', () => {
    renderEmbedded(
      <KpiCards
        kpis={{
          confirmed: {
            count: 19,
            value: [{ currency: 'USD', amount: '4500.50' }],
          },
          canceled_before_shipping: { count: 6 },
          confirmation_rate: { rate: 67.9, confirmed: 19, sent: 28 },
        }}
      />
    )
    const amount = screen.getByText('US$ 4,500.50')
    expect(amount.closest('bdi')?.getAttribute('dir')).toBe('ltr')
    expect(screen.getByText('68%')).toBeTruthy()
    expect(screen.getByText('19 من 28 طلباً أرسلنا لها رسالة')).toBeTruthy()
    expect(screen.getByText('6 شحنات ومرتجعات لم تدفع تكلفتها')).toBeTruthy()
  })

  it('reads an empty period as a dash, not 0%', () => {
    renderEmbedded(
      <KpiCards
        kpis={{
          confirmed: { count: 0, value: [] },
          canceled_before_shipping: { count: 0 },
          confirmation_rate: { rate: null, confirmed: 0, sent: 0 },
        }}
      />,
      'en'
    )
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByText('No messages sent in this period yet')).toBeTruthy()
  })
})

describe('SettingsStatusLine', () => {
  it('reads the real settings, with state for screen readers', () => {
    const onEdit = vi.fn()
    renderEmbedded(
      <SettingsStatusLine
        settings={{
          auto_verify_enabled: true,
          follow_up_enabled: true,
          follow_up_delay_minutes: 360,
          quiet_hours_enabled: true,
          quiet_hours_start: '21:00',
          quiet_hours_end: '09:00',
        }}
        onEdit={onEdit}
      />
    )
    const items = screen
      .getAllByRole('listitem')
      .map((node) => node.textContent)
    expect(items).toEqual([
      'التأكيد التلقائي (مفعّل)',
      'تذكير بعد 6 ساعات (مفعّل)',
      'هدوء 9م–9ص (مفعّل)',
    ])
    fireEvent.click(
      screen.getByRole('button', { name: 'تعديل إعدادات التأكيد' })
    )
    expect(onEdit).toHaveBeenCalled()
  })

  it('says what is off', () => {
    renderEmbedded(
      <SettingsStatusLine
        settings={{
          auto_verify_enabled: false,
          follow_up_enabled: false,
          follow_up_delay_minutes: 120,
          quiet_hours_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        }}
        onEdit={vi.fn()}
      />,
      'en'
    )
    expect(
      screen.getAllByRole('listitem').map((node) => node.textContent)
    ).toEqual([
      'Auto-confirm off (Off)',
      'Reminder off (Off)',
      'No quiet hours (Off)',
    ])
  })
})

function listRow(overrides: Partial<VerificationItem> = {}): VerificationItem {
  return {
    id: 'v-1',
    status: 'confirmed',
    reason: null,
    order_id: 'o-1',
    order_number: '1137',
    is_test: false,
    customer_name: 'Guest',
    customer_phone: '+201148675077',
    total_price: '49.95',
    currency: 'USD',
    created_at: '2026-09-16T06:49:00Z',
    last_sent_at: '2026-09-16T06:49:00Z',
    delivered_at: null,
    read_at: null,
    confirmed_at: '2026-09-16T07:00:00Z',
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    platform: 'shopify',
    external_order_id: '5551137',
    updated_at: '2026-09-16T06:49:00Z',
    ...overrides,
  }
}

describe('ConfirmationsTable', () => {
  const tableProps = {
    timeZone: 'UTC',
    canWrite: true,
    canRetry: true,
    actingId: null,
    handlers: {
      onRequestConfirm: vi.fn(),
      onRequestCancel: vi.fn(),
      onRetry: vi.fn(),
    },
    pagination: {
      label: '1–2 من 2',
      hasNext: false,
      hasPrevious: false,
      onNext: vi.fn(),
      onPrevious: vi.fn(),
      previousLabel: 'الصفحة السابقة',
      nextLabel: 'الصفحة التالية',
    },
  }

  it('shows the phone as the name line and "بدون اسم" below when nameless', () => {
    renderEmbedded(<ConfirmationsTable rows={[listRow()]} {...tableProps} />)
    expect(screen.getByText('+20 114 867 5077')).toBeTruthy()
    expect(screen.getByText('بدون اسم')).toBeTruthy()
    expect(screen.queryByText('Guest')).toBeNull()
    expect(screen.getByText('مؤكد')).toBeTruthy()
    const link = screen.getByRole('link', { name: /#1137/ })
    expect(link.getAttribute('href')).toBe('shopify://admin/orders/5551137')
  })

  it('strikes through a canceled amount and offers chat only when action is needed', () => {
    renderEmbedded(
      <ConfirmationsTable
        rows={[
          listRow({
            id: 'v-2',
            status: 'canceled',
            cancellation_source: 'customer',
          }),
          listRow({
            id: 'v-3',
            order_number: '1138',
            status: 'read',
            confirmed_at: null,
            action_reason: 'no_reply_after_follow_up',
            follow_up_sent_at: '2026-09-17T06:49:00Z',
          }),
        ]}
        {...tableProps}
      />
    )
    expect(screen.getByText('ألغاه العميل')).toBeTruthy()
    expect(screen.getByText('لم يرد')).toBeTruthy()
    expect(screen.getByText('أُرسل التذكير')).toBeTruthy()
    const chats = screen.getAllByRole('link', { name: /واتساب/ })
    expect(chats).toHaveLength(1)
    expect(screen.getByLabelText('الصفحة السابقة')).toBeTruthy()
  })
})
