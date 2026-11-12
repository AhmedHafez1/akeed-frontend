import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import { settingsResponseFixture } from '@/features/settings/testing/settingsFixture'
import type { SendingAvailability } from '@/shared/types/sendingAvailability'
import { PlanRequiredStep } from './PlanRequiredStep'
import en from '../../../../../public/messages/en.json'
import ar from '../../../../../public/messages/ar.json'

const api = vi.hoisted(() => ({
  fetchShopifyPlans: vi.fn(),
  createShopifySubscription: vi.fn(),
}))
vi.mock('../../api/shopifyPlansApi', () => api)
vi.mock('@/features/whatsapp-connect', () => ({
  useOwnNumberPresence: () => ({ visible: false, connected: false }),
}))
const availability: SendingAvailability = {
  available: false,
  reason: 'billing_not_active',
  billingStatus: 'cancelled',
  planState: 'cancelled',
  currentPlanId: null,
  lastPlanId: 'pro',
  lastPlanName: 'Akeed Pro',
  cancelledAt: '2026-11-11T00:00:00Z',
  paidThroughAt: null,
  missedOrders: null,
}
beforeEach(() => {
  vi.clearAllMocks()
  api.fetchShopifyPlans.mockResolvedValue({
    plans: settingsResponseFixture().billing.plans,
    billingManagement: { mode: 'shopify', canManageBilling: true },
    isFreePlanClaimed: true,
    currentPlanId: null,
  })
  api.createShopifySubscription.mockResolvedValue({
    confirmationUrl: 'https://synthetic.myshopify.com/approve',
  })
})
describe.each(['ar', 'en'] as const)(
  'Shopify plan-required step (%s)',
  (locale) => {
    it('uses the existing picker with the previous plan selected and allows choose later', async () => {
      const later = vi.fn()
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      renderEmbedded(
        <QueryClientProvider client={client}>
          <PlanRequiredStep
            availability={availability}
            hostParam="host-1"
            onChooseLater={later}
          />
        </QueryClientProvider>,
        locale
      )
      await screen.findByRole('radiogroup')
      const copy = (locale === 'ar' ? ar : en).shopifyPlanRequired
      expect(screen.getByRole('heading', { name: copy.heading })).toBeTruthy()
      expect(
        (
          screen
            .getAllByRole('radio')
            .find(
              (node) => (node as HTMLInputElement).value === 'pro'
            ) as HTMLInputElement
        ).checked
      ).toBe(true)
      expect(screen.getByText(copy.freeUsed)).toBeTruthy()
      expect(screen.queryByText(/you're live/i)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: copy.chooseLater }))
      expect(later).toHaveBeenCalledTimes(1)
      const subscribe = screen
        .getAllByRole('button')
        .find((node) =>
          node.textContent?.includes(locale === 'ar' ? 'اشترك' : 'Subscribe')
        )!
      await act(async () => fireEvent.click(subscribe))
      expect(api.createShopifySubscription).toHaveBeenCalledWith(
        'pro',
        'host-1',
        { renew: false }
      )
    })
  }
)
