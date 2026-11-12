import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { AdminStore } from './admin.model'
import { StoresAdminPage } from './StoresAdminPage'

const api = vi.hoisted(() => ({ stores: vi.fn() }))
const nav = vi.hoisted(() => ({ replace: vi.fn(), params: '' }))
vi.mock('./adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./adminApi')>()),
  getAdminStores: api.stores,
}))
vi.mock('@/shared/hooks/useLocaleInfo', () => ({
  useLocaleInfo: () => ({ locale: 'en', isRTL: false }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/en/admin/stores',
  useSearchParams: () => new URLSearchParams(nav.params),
}))

function store(overrides: Partial<AdminStore> = {}): AdminStore {
  return {
    integration_id: 'store-1',
    org_id: 'org-1',
    platform: 'shopify',
    organization_name: 'Cairo Fashion House',
    store_name: 'Cairo Fashion House',
    shop_domain: 'cairo-fashion.example.test',
    source_identity: 'cairo-fashion.example.test',
    country_code: 'EG',
    customer_countries: { top: 'EG', share: 100, count: 1 },
    timezone: 'Africa/Cairo',
    installed_at: '2026-10-01T10:00:00Z',
    lifecycle_status: 'active',
    onboarding_status: 'completed',
    plan: 'pro',
    subscription_status: 'active',
    usage: { used: 842, limit: 1000, remaining: 158, percent: 84 },
    billing: {
      model: 'plan',
      plan: 'pro',
      subscription_status: 'active',
      usage: { used: 842, limit: 1000, remaining: 158, percent: 84 },
    },
    auto_confirmation_enabled: true,
    test_message_status: 'delivered',
    first_eligible_real_order_at: null,
    activated_at: null,
    last_activity_at: '2026-11-12T09:40:00Z',
    health: {
      status: 'critical',
      top_signal: 'orders_not_eligible',
      signal_count: 2,
      signals: ['orders_not_eligible', 'usage_attention'],
      levels: { orders_not_eligible: 'critical', usage_attention: 'attention' },
      details: {
        orders_not_eligible: {
          received: 13,
          eligible: 1,
          skipped: 12,
          top_reason: 'non_cod_payment_method',
          top_payment_method: 'manual',
        },
        usage_attention: { percent: 84, used: 842, limit: 1000 },
      },
    },
    data_quality: [],
    ...overrides,
  }
}

const healthy = store({
  integration_id: 'store-2',
  store_name: 'Alexandria Kids',
  health: {
    status: 'healthy',
    top_signal: null,
    signal_count: 0,
    signals: [],
    levels: {},
    details: {},
  },
})

const DETAIL =
  '12 of 13 orders skipped in 24h · top reason: not COD (payment method: manual)'

describe('admin store list signals', () => {
  beforeEach(() => {
    nav.replace.mockReset()
    nav.params = ''
    api.stores.mockReset().mockResolvedValue({
      summary: {},
      data: [store(), healthy],
      next_cursor: null,
      evaluated_at: '2026-11-12T10:00:00Z',
    })
  })

  it('shows the readable top signal, its facts and how many more in the table', async () => {
    render(<StoresAdminPage />)

    const table = await screen.findByRole('table')
    const cairo = within(table).getByText('Cairo Fashion House').closest('tr')!
    expect(
      within(cairo).getByText('Orders arriving but not confirmed')
    ).toBeTruthy()
    expect(within(cairo).getByText(DETAIL)).toBeTruthy()
    expect(within(cairo).getByText('+1 more')).toBeTruthy()
    expect(within(cairo).queryByText('Orders Not Eligible')).toBeNull()
    const quiet = within(table).getByText('Alexandria Kids').closest('tr')!
    expect(within(quiet).queryByText(/more$/)).toBeNull()
  })

  it('puts the same signal line on the phone card, tinted by its level', async () => {
    render(<StoresAdminPage />)

    const card = (await screen.findAllByRole('article')).find((article) =>
      within(article).queryByText('Cairo Fashion House')
    )!
    const label = within(card).getByText('Orders arriving but not confirmed')
    expect(label.textContent).toBe(
      'Orders arriving but not confirmed · +1 more'
    )
    expect(within(card).getByText(DETAIL)).toBeTruthy()
    expect(label.closest('div')!.className).toContain('bg-destructive-subtle')
    const quiet = screen
      .getAllByRole('article')
      .find((article) => within(article).queryByText('Alexandria Kids'))!
    expect(quiet.querySelector('.bg-destructive-subtle')).toBeNull()
  })

  it('filters by signal through the URL and labels the active filter', async () => {
    render(<StoresAdminPage />)
    await screen.findByRole('table')

    fireEvent.change(screen.getByRole('combobox', { name: 'Signal' }), {
      target: { value: 'reinstalled_without_plan' },
    })

    expect(nav.replace).toHaveBeenCalledWith(
      '/en/admin/stores?signal=reinstalled_without_plan',
      { scroll: false }
    )
  })

  it('shows the active signal filter with its label', async () => {
    nav.params = 'signal=paid_store_uninstalled'
    render(<StoresAdminPage />)

    expect(
      await screen.findByRole('button', { name: 'Remove Signal filter' })
    ).toHaveProperty(
      'textContent',
      expect.stringContaining('Paying store uninstalled')
    )
    expect(api.stores).toHaveBeenCalledWith('signal=paid_store_uninstalled')
  })
})
