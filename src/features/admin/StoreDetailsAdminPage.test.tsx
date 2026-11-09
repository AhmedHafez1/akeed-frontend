import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import type { AdminStoreDetail } from './admin.model'
import { StoreDetailsAdminPage } from './StoreDetailsAdminPage'
import { AdminApiError } from './adminApi'

const api = vi.hoisted(() => ({ store: vi.fn(), verifications: vi.fn() }))
vi.mock('./adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./adminApi')>()),
  getAdminStore: api.store,
  getAdminStoreVerifications: api.verifications,
}))
vi.mock('@/shared/hooks/useLocaleInfo', () => ({
  useLocaleInfo: () => ({ locale: 'en', isRTL: false }),
}))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

function store(
  settings: Partial<AdminStoreDetail['settings']> = {},
  integrationId = 'store-1'
): AdminStoreDetail {
  return {
    integration_id: integrationId,
    org_id: 'org-1',
    platform: 'shopify',
    organization_name: 'Cairo Store',
    store_name: 'Cairo Store',
    shop_domain: 'cairo.example.test',
    source_identity: 'cairo.example.test',
    country_code: 'EG',
    customer_countries: { top: 'EG', share: 100, count: 1 },
    timezone: 'Africa/Cairo',
    installed_at: '2026-11-01T10:00:00Z',
    lifecycle_status: 'active',
    onboarding_status: 'completed',
    plan: 'basic',
    subscription_status: 'active',
    usage: { used: 10, limit: 100, remaining: 90, percent: 10 },
    billing: {
      model: 'plan',
      plan: 'basic',
      subscription_status: 'active',
      usage: { used: 10, limit: 100, remaining: 90, percent: 10 },
    },
    auto_confirmation_enabled: true,
    test_message_status: 'delivered',
    first_eligible_real_order_at: null,
    activated_at: null,
    last_activity_at: null,
    health: {
      status: 'healthy',
      top_signal: null,
      signal_count: 0,
      signals: [],
    },
    data_quality: [],
    owner_email: 'owner@example.test',
    merchant_whatsapp_phone: null,
    created_at: null,
    last_synced_at: null,
    billing_activated_at: null,
    settings: {
      default_language: 'auto',
      shipping_currency: 'EGP',
      follow_up_enabled: true,
      follow_up_delay_minutes: 120,
      escalation_enabled: true,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      send_delay_minutes: 0,
      ...settings,
    },
    milestones: [],
    verification_totals: {
      total: 0,
      test: 0,
      sent: 0,
      by_status: {},
      failed_24h: 0,
      total_24h: 0,
    },
  }
}
const response = (
  value: AdminStoreDetail,
  evaluated_at = '2026-11-06T06:00:00Z'
) => ({ store: value, evaluated_at })
const row = (label: string) =>
  screen.getByText(label, { selector: 'dt' }).parentElement!

describe('admin store automation visibility', () => {
  beforeEach(() => {
    api.store.mockReset()
    api.verifications
      .mockReset()
      .mockResolvedValue({ data: [], next_cursor: null })
  })

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    'shows saved thank-you=%s and auto-cancellation=%s as read-only values',
    async (thanks, cancel) => {
      api.store.mockResolvedValue(
        response(
          store({ acknowledgment_enabled: thanks, auto_cancel_enabled: cancel })
        )
      )
      render(<StoreDetailsAdminPage integrationId="store-1" />)
      await screen.findByText('Thank-you messages')
      expect(
        within(row('Thank-you messages')).getByText(thanks ? 'On' : 'Off')
      ).toBeTruthy()
      expect(
        within(row('Auto-cancellation')).getByText(cancel ? 'On' : 'Off')
      ).toBeTruthy()
      const automation = screen
        .getByRole('heading', { name: 'Automation' })
        .closest('section')!
      expect(within(automation).queryByRole('switch')).toBeNull()
      expect(within(automation).queryByRole('checkbox')).toBeNull()
      expect(within(automation).queryByRole('button')).toBeNull()
      expect(api.store).toHaveBeenCalledWith('store-1')
    }
  )

  it('shows Unknown for absent preferences from an older backend', async () => {
    api.store.mockResolvedValue(response(store()))
    render(<StoreDetailsAdminPage integrationId="store-1" />)
    await screen.findByText('Thank-you messages')
    expect(within(row('Thank-you messages')).getByText('Unknown')).toBeTruthy()
    expect(within(row('Auto-cancellation')).getByText('Unknown')).toBeTruthy()
  })

  it('updates the values on refresh and when inspecting a different store', async () => {
    api.store
      .mockResolvedValueOnce(
        response(
          store({ acknowledgment_enabled: true, auto_cancel_enabled: false })
        )
      )
      .mockResolvedValueOnce(
        response(
          store({ acknowledgment_enabled: false, auto_cancel_enabled: true }),
          '2026-11-06T06:01:00Z'
        )
      )
      .mockResolvedValueOnce(
        response(
          store(
            { acknowledgment_enabled: true, auto_cancel_enabled: true },
            'store-2'
          )
        )
      )
    const view = render(<StoreDetailsAdminPage integrationId="store-1" />)
    await screen.findByText('Thank-you messages')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() =>
      expect(within(row('Thank-you messages')).getByText('Off')).toBeTruthy()
    )
    expect(within(row('Auto-cancellation')).getByText('On')).toBeTruthy()
    view.rerender(<StoreDetailsAdminPage integrationId="store-2" />)
    await waitFor(() =>
      expect(within(row('Thank-you messages')).getByText('On')).toBeTruthy()
    )
    expect(within(row('Auto-cancellation')).getByText('On')).toBeTruthy()
    expect(api.store).toHaveBeenLastCalledWith('store-2')
  })

  it('retains the missing-store state without inventing settings', async () => {
    api.store.mockRejectedValue(new AdminApiError('Store not found', 404, null))
    render(<StoreDetailsAdminPage integrationId="missing" />)
    await screen.findByRole('heading', { name: 'Store not found' })
    expect(screen.queryByText('Thank-you messages')).toBeNull()
  })

  it('offers the resend inside an expanded order awaiting review', async () => {
    api.store.mockResolvedValue(response(store()))
    api.verifications.mockResolvedValue({
      data: [
        {
          id: 'ver-1',
          status: 'failed',
          reason: 'provider_outcome_unknown',
          failure_code: null,
          failure_title: null,
          order_number: '3141',
          external_order_id: '6580956037477',
          is_test: false,
          customer_name: 'Customer',
          customer_phone_masked: '+2011•••••410',
          customer_country: 'EG',
          total_price: '2300.00',
          currency: 'EGP',
          attempts: 0,
          follow_up_attempts: 0,
          resend_dispatch_id: 'dispatch-1',
          template_name: null,
          language_code: null,
          cancellation_source: null,
          created_at: '2026-11-09T17:29:00Z',
          updated_at: null,
          last_sent_at: null,
          delivered_at: null,
          read_at: null,
          confirmed_at: null,
          canceled_at: null,
          expired_at: null,
          no_reply_at: null,
          follow_up_sent_at: null,
        },
      ],
      next_cursor: null,
      total_count: 1,
    })
    render(<StoreDetailsAdminPage integrationId="store-1" />)

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Show details for order 3141',
      })
    )

    // The desktop table and the mobile list both render the details.
    expect(
      await screen.findAllByRole('button', { name: 'Mark not sent and resend' })
    ).not.toHaveLength(0)
  })
})
