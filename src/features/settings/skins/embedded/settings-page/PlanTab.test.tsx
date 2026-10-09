import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { settingsResponseFixture } from '@/features/settings/testing/settingsFixture'
import { PlanTab } from './PlanTab'

type FixtureOverrides = NonNullable<
  Parameters<typeof settingsResponseFixture>[0]
>

function renderTab(
  overrides: FixtureOverrides = {},
  model: Partial<EmbeddedSettingsModel> = {}
) {
  const subscribe = vi.fn()
  renderEmbedded(
    <PlanTab
      model={
        {
          subscribingPlanId: null,
          planError: null,
          dismissPlanError: vi.fn(),
          subscribe,
          ...model,
        } as unknown as EmbeddedSettingsModel
      }
      data={settingsResponseFixture(overrides)}
    />
  )
  return { subscribe }
}

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

function primaryButtons() {
  return screen
    .getAllByRole('button')
    .filter((element) => element.className.includes('variantPrimary'))
}

const PAID_NEAR_LIMIT: FixtureOverrides = {
  state: { billingPlanId: 'basic' },
  billing: {
    usage: {
      used: 264,
      limit: 300,
      periodStart: '2026-09-21',
      periodEnd: '2026-10-21',
    },
    messagesSentLast30Days: 264,
  },
}

describe('PlanTab', () => {
  it('shows the free plan as a one-time allowance, with no recommendation', () => {
    renderTab({
      billing: {
        usage: {
          used: 1,
          limit: 30,
          periodStart: '2026-10-01',
          periodEnd: null,
        },
        messagesSentLast30Days: 0,
      },
    })

    expect(screen.getByText('باقتك الحالية: البداية')).toBeTruthy()
    expect(screen.getByText('مجانية')).toBeTruthy()
    expect(screen.getByText('من 30 رسالة مستخدمة')).toBeTruthy()
    expect(screen.getByText('متبقي 29 رسالة')).toBeTruthy()
    expect(screen.getByText(/رصيد تجريبي لمرة واحدة ولا يتجدد/)).toBeTruthy()
    expect(screen.queryByText(/يتجدد رصيدك إلى/)).toBeNull()

    expect(screen.getByText('اختر عدد الرسائل الشهري')).toBeTruthy()
    expect(screen.getByText('US$ 9.99')).toBeTruthy()
    expect(screen.getByText('US$ 22.99')).toBeTruthy()
    expect(screen.getByText('US$ 49.99')).toBeTruthy()
    expect(screen.getByText('2,500')).toBeTruthy()
    expect(screen.getByText(/نحو 10 رسائل يومياً/)).toBeTruthy()
    expect(screen.getByText(/نحو 83 رسالة يومياً/)).toBeTruthy()
    expect(screen.getByText(/US\$ 0\.033/)).toBeTruthy()
    expect(screen.getByText('المتقدمة')).toBeTruthy()

    expect(screen.queryByText('الأنسب لاستخدامك')).toBeNull()
    expect(primaryButtons()).toEqual([button('اشترك في الأساسية')])

    expect(screen.getByText('كل الباقات تشمل')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getByText('كيف نحتسب الرسائل')).toBeTruthy()
    expect(screen.getByText('عند نفاد الرصيد')).toBeTruthy()
    expect(
      screen.getByText('الدفع عبر فاتورة شوبيفاي. يمكنك تغيير باقتك في أي وقت.')
    ).toBeTruthy()
  })

  it('shows a paid plan near its limit with the renewal date and one recommendation', () => {
    renderTab(PAID_NEAR_LIMIT)

    expect(screen.getByText('باقتك الحالية: الأساسية')).toBeTruthy()
    expect(screen.getByText('شهرية')).toBeTruthy()
    // The banner title and the usage row both state what is left.
    expect(screen.getAllByText('متبقي 36 رسالة')).toHaveLength(2)
    expect(
      screen.getByText(/حتى يتجدد رصيدك في 21 أكتوبر 2026، أو حتى تنتقل/)
    ).toBeTruthy()
    expect(
      screen.getByText(
        'يتجدد رصيدك إلى 300 رسالة في 21 أكتوبر 2026، ثم كل 30 يوماً. الرسائل غير المستخدمة لا تُرحَّل.'
      )
    ).toBeTruthy()
    expect(screen.queryByText(/رصيد تجريبي لمرة واحدة/)).toBeNull()

    expect(screen.getAllByText('الأنسب لاستخدامك')).toHaveLength(1)
    expect(screen.getByText('أرسلت 264 رسالة في آخر 30 يوماً.')).toBeTruthy()
    expect(primaryButtons()).toEqual([button('اشترك في الاحترافية')])
  })

  it('disables the current plan and subscribes to another', () => {
    const { subscribe } = renderTab(PAID_NEAR_LIMIT)

    const current = button('باقتك الحالية')
    expect(
      current.disabled || current.getAttribute('aria-disabled')
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'اشترك في الأساسية' })
    ).toBeNull()

    fireEvent.click(button('اشترك في الاحترافية'))
    expect(subscribe).toHaveBeenCalledWith('pro')
  })

  it('moves the primary button up when the store is on the plan that fits', () => {
    renderTab({
      ...PAID_NEAR_LIMIT,
      billing: { ...PAID_NEAR_LIMIT.billing, messagesSentLast30Days: 120 },
    })

    expect(screen.getAllByText('الأنسب لاستخدامك')).toHaveLength(1)
    expect(primaryButtons()).toEqual([button('اشترك في الاحترافية')])
  })

  it('offers no plans to a store the Akeed team bills', () => {
    renderTab({
      state: {
        billingManagement: { mode: 'manual', canManageBilling: false },
      },
    })

    expect(screen.getByText(/تتم إدارة باقتك من فريق أكيد/)).toBeTruthy()
    expect(screen.queryByText('اختر عدد الرسائل الشهري')).toBeNull()
    expect(screen.queryByRole('button', { name: /اشترك في/ })).toBeNull()
  })
})
