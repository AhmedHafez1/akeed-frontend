import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderEmbedded } from '../embeddedTestUtils'
import type { SendingAvailability } from '@/shared/types/sendingAvailability'
import { BlockedOrdersBanner } from './BlockedOrdersBanner'
import en from '../../../../../../../public/messages/en.json'
import ar from '../../../../../../../public/messages/ar.json'

const subscribe = vi.hoisted(() => vi.fn())
vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/billing')>()),
  useShopifySubscribe: () => ({ subscribe, isSubscribing: false, error: null }),
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
  missedOrders: {
    count: 12,
    since: '2026-11-10T00:00:00Z',
    until: '2026-11-12T00:00:00Z',
  },
}
describe.each(['ar', 'en'] as const)(
  'Shopify no-plan banner (%s)',
  (locale) => {
    it('keeps the warning visible to viewers without subscription actions', () => {
      const { container } = renderEmbedded(
        <BlockedOrdersBanner
          availability={availability}
          canSubscribe={false}
          capacity={null}
          timeZone="UTC"
          hostParam={null}
          onChoosePlan={vi.fn()}
        />,
        locale
      )
      expect(container.querySelectorAll('.Polaris-Banner')).toHaveLength(1)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })
    it('shows with zero held orders, has no dismiss action and resubscribes directly', () => {
      const copy = (locale === 'ar' ? ar : en).shopifyPlanRequired
      const { container } = renderEmbedded(
        <BlockedOrdersBanner
          availability={availability}
          capacity={null}
          timeZone="UTC"
          hostParam="host-1"
          onChoosePlan={vi.fn()}
        />,
        locale
      )
      expect(screen.getByText(copy.criticalTitle)).toBeTruthy()
      expect(container.querySelectorAll('.Polaris-Banner')).toHaveLength(1)
      expect(screen.getAllByRole('button')).toHaveLength(2)
      fireEvent.click(screen.getAllByRole('button')[0])
      expect(subscribe).toHaveBeenCalledWith('pro')
    })
    it('combines capacity and no-plan information in one banner', () => {
      const { container } = renderEmbedded(
        <BlockedOrdersBanner
          availability={availability}
          capacity={{
            blocked_count: 3,
            mode: 'plan',
            remaining: 0,
            action: 'upgrade',
            reset_at: null,
          }}
          timeZone="UTC"
          hostParam={null}
          onChoosePlan={vi.fn()}
        />,
        locale
      )
      expect(container.querySelectorAll('.Polaris-Banner')).toHaveLength(1)
      expect(screen.getByText(/48|٤٨/)).toBeTruthy()
    })
    it('hides once entitled when no orders are held', () => {
      const { container } = renderEmbedded(
        <BlockedOrdersBanner
          availability={{
            ...availability,
            available: true,
            reason: null,
            planState: 'active',
            currentPlanId: 'pro',
          }}
          capacity={null}
          timeZone="UTC"
          hostParam={null}
          onChoosePlan={vi.fn()}
        />,
        locale
      )
      expect(container.querySelector('.Polaris-Banner')).toBeNull()
    })
  }
)
