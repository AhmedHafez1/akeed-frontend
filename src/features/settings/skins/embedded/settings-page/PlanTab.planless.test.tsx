import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import { settingsResponseFixture } from '@/features/settings/testing/settingsFixture'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { PlanTab } from './PlanTab'
import en from '../../../../../../public/messages/en.json'
import ar from '../../../../../../public/messages/ar.json'

describe.each(['en', 'ar'] as const)(
  'Plan tab without entitlement (%s)',
  (locale) => {
    it('shows no active plan, a dated previous plan, and no old usage meters', () => {
      const subscribe = vi.fn()
      const data = settingsResponseFixture({
        state: {
          billingStatus: 'cancelled',
          billingPlanId: 'pro',
          sendingAvailability: {
            available: false,
            reason: 'billing_not_active',
            billingStatus: 'cancelled',
            planState: 'cancelled',
            currentPlanId: null,
            lastPlanId: 'pro',
            lastPlanName: 'Akeed Pro',
            cancelledAt: '2026-11-11T10:00:00Z',
            paidThroughAt: null,
            missedOrders: null,
          },
        },
        billing: {
          currentPlanId: null,
          usage: {
            used: 999,
            limit: 1000,
            periodStart: '2026-10-01',
            periodEnd: '2026-10-31',
          },
        },
      })
      const model = {
        subscribingPlanId: null,
        planError: null,
        dismissPlanError: vi.fn(),
        subscribe,
      } as unknown as EmbeddedSettingsModel
      renderEmbedded(<PlanTab data={data} model={model} />, locale)
      expect(
        screen.getByText((locale === 'en' ? en : ar).shopifyPlanRequired.noPlan)
      ).toBeTruthy()
      expect(
        screen.getByText(
          locale === 'en'
            ? /Previous plan: Pro.*Cancelled/
            : /الباقة السابقة: الاحترافية.*أُلغيت/
        )
      ).toBeTruthy()
      expect(screen.queryByRole('progressbar')).toBeNull()
      expect(screen.queryByText('999')).toBeNull()
      fireEvent.click(
        screen.getByRole('button', {
          name: locale === 'en' ? 'Subscribe to Pro' : 'اشترك في الاحترافية',
        })
      )
      expect(subscribe).toHaveBeenCalledWith('pro')
    })
  }
)
