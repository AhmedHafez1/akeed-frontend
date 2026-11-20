import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderEmbedded } from '@/features/dashboard/skins/embedded/components/embeddedTestUtils'
import { settingsResponseFixture } from '@/features/settings/testing/settingsFixture'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import type { PlanNumberState } from '@/features/settings/domain/planNumber'
import { PlanTab } from './PlanTab'
import en from '../../../../../../public/messages/en.json'
import ar from '../../../../../../public/messages/ar.json'

const number: PlanNumberState = {
  status: 'ready',
  visible: true,
  connected: true,
  canConnect: true,
}
const originalScroll = HTMLElement.prototype.scrollIntoView
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  HTMLElement.prototype.scrollIntoView = originalScroll
})

function renderTab(
  locale: 'en' | 'ar',
  options: {
    akeed?: number
    own?: number
    number?: Partial<PlanNumberState>
    free?: boolean
    paidThrough?: boolean
    canSubscribe?: boolean
    busy?: boolean
    legacy?: boolean
  } = {}
) {
  const akeedLimit = options.free ? 60 : 300
  const ownLimit = options.free ? 200 : 2000
  const akeedLeft = options.akeed ?? 0
  const ownLeft = options.own ?? 800
  const presence = { ...number, ...options.number }
  const combined = ['ready', 'partial'].includes(presence.status)
  const data = settingsResponseFixture({
    state: {
      billingPlanId: options.free ? 'starter' : 'basic',
      permissions: {
        canUpdateConfiguration: options.canSubscribe ?? true,
        canCompleteOnboarding: false,
      },
    },
    billing: {
      currentPlanId: options.free ? 'starter' : 'basic',
      paidThroughAt: options.paidThrough ? '2026-12-18T08:00:00Z' : null,
      usage: {
        used: akeedLimit - akeedLeft + (combined ? ownLimit - ownLeft : 0),
        limit: akeedLimit + (combined ? ownLimit : 0),
        periodStart: '2026-11-18',
        periodEnd: options.free ? null : '2026-12-18',
        pools: options.legacy
          ? undefined
          : {
              akeed: {
                used: akeedLimit - akeedLeft,
                limit: akeedLimit,
                remaining: akeedLeft,
              },
              ownNumber: {
                used: ownLimit - ownLeft,
                limit: ownLimit,
                remaining: ownLeft,
              },
            },
      },
    },
  })
  data.billing.plans = data.billing.plans.map((plan) => ({
    ...plan,
    ownNumberIncludedVerifications: plan.id === 'basic' ? 2000 : 200,
  }))
  const subscribe = vi.fn()
  const onOpenWhatsapp = vi.fn()
  renderEmbedded(
    <PlanTab
      data={data}
      ownNumber={presence}
      onOpenWhatsapp={onOpenWhatsapp}
      model={
        {
          subscribingPlanId: options.busy ? 'basic' : null,
          planError: null,
          dismissPlanError: vi.fn(),
          subscribe,
        } as unknown as EmbeddedSettingsModel
      }
    />,
    locale
  )
  return { subscribe, onOpenWhatsapp }
}

describe.each(['en', 'ar'] as const)('Plan allowances (%s)', (locale) => {
  const messages = locale === 'en' ? en : ar
  const copy = messages.settings.embedded.plan
  const notice = copy.allowanceBanner
  const renew = locale === 'en' ? 'Renew Basic now' : 'جدِّد باقة الأساسية الآن'

  it('hides unconnected current usage even after previous own-number sends; keeps plan offers', () => {
    renderTab(locale, { number: { status: 'unconnected', connected: false } })
    expect(screen.getAllByRole('progressbar')).toHaveLength(1)
    expect(screen.queryByText(copy.pools.ownNumber)).toBeNull()
    expect(screen.getByText(copy.pools.akeed)).toBeTruthy()
    expect(screen.getByText(notice.connectTitle)).toBeTruthy()
    expect(screen.getAllByText(/2,000/).length).toBeGreaterThan(0)
  })
  it('shows both current pools without the removed heading', () => {
    renderTab(locale)
    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
    expect(screen.getByText(copy.pools.ownNumber)).toBeTruthy()
    expect(screen.queryByText(copy.criticalTitle)).toBeNull()
    expect(screen.queryByText('Two pools. One billing period.')).toBeNull()
  })
  it('does not show exhaustion when own messages are empty and Akeed messages remain', () => {
    renderTab(locale, { own: 0, akeed: 300 })
    expect(screen.queryByText(copy.criticalTitle)).toBeNull()
    expect(screen.queryByText(notice.connectTitle)).toBeNull()
  })
  it('warns about combined usable messages at the existing threshold', () => {
    renderTab(locale, { own: 460 })
    expect(screen.queryByText(copy.criticalTitle)).toBeNull()
    expect(
      screen.getAllByText(
        locale === 'en' ? '460 messages left' : 'متبقي 460 رسالة'
      )
    ).toHaveLength(2)
  })
  it('preserves the current banner when both pools are exhausted', () => {
    renderTab(locale, { own: 0 })
    expect(screen.getByText(copy.criticalTitle)).toBeTruthy()
    expect(screen.getByText(copy.criticalBody)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: notice.connectAction })
    ).toBeNull()
  })
  it('renews with the existing flow and opens WhatsApp settings from the connection offer', () => {
    const { subscribe, onOpenWhatsapp } = renderTab(locale, {
      number: { status: 'unconnected', connected: false },
    })
    fireEvent.click(screen.getAllByRole('button', { name: renew })[0])
    expect(subscribe).toHaveBeenCalledWith('basic', { renew: true })
    fireEvent.click(screen.getByRole('button', { name: notice.connectAction }))
    expect(onOpenWhatsapp).toHaveBeenCalledOnce()
  })
  it.each([
    ['preparing', 'setup', 'setupAction'],
    ['disconnected', 'reconnect', 'reconnectAction'],
    ['attention', 'attention', 'reviewAction'],
    ['partial', 'partial', 'reviewAction'],
  ] as const)(
    'guides %s to the existing WhatsApp tab',
    (status, key, actionKey) => {
      const { onOpenWhatsapp } = renderTab(locale, {
        number: {
          status,
          connected: ['attention', 'partial'].includes(status),
        },
      })
      expect(screen.getByText(notice[`${key}Title`])).toBeTruthy()
      expect(screen.getByText(notice[`${key}Body`])).toBeTruthy()
      expect(screen.queryByText(copy.criticalBody)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: notice[actionKey] }))
      expect(onOpenWhatsapp).toHaveBeenCalledOnce()
    }
  )
  it('offers plan selection to free users instead of renewal', () => {
    renderTab(locale, {
      free: true,
      own: 200,
      number: { status: 'unconnected', connected: false },
    })
    expect(screen.getByText(notice.connectChooseBody)).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: messages.shopifyPlanRequired.choosePlan,
      })
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: renew })).toBeNull()
    fireEvent.click(
      screen.getByRole('button', {
        name: messages.shopifyPlanRequired.choosePlan,
      })
    )
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledOnce()
    expect(document.activeElement?.textContent).toContain(
      messages.billing.embeddedPlans.heading
    )
  })
  it('does not renew a paid-through plan', () => {
    renderTab(locale, {
      paidThrough: true,
      number: { status: 'unconnected', connected: false },
    })
    expect(
      screen.getByRole('button', {
        name: messages.shopifyPlanRequired.choosePlan,
      })
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: renew })).toBeNull()
  })
  it('does not promote unavailable connections or invent allowance for a legacy payload', () => {
    renderTab(locale, {
      legacy: true,
      number: { status: 'unconnected', connected: false },
    })
    expect(screen.queryByText(notice.connectTitle)).toBeNull()
    expect(
      screen.queryByRole('button', { name: notice.connectAction })
    ).toBeNull()
  })
  it('does not promote connection while status is loading or failed', () => {
    renderTab(locale, {
      number: { status: 'unknown', connected: false, canConnect: false },
    })
    expect(screen.queryByText(notice.connectTitle)).toBeNull()
    expect(
      screen.queryByRole('button', { name: notice.connectAction })
    ).toBeNull()
  })
  it('respects billing and connection permissions', () => {
    const { subscribe } = renderTab(locale, {
      canSubscribe: false,
      number: { status: 'unconnected', connected: false, canConnect: false },
    })
    expect(
      screen.queryByRole('button', { name: notice.connectAction })
    ).toBeNull()
    for (const button of screen.getAllByRole('button', { name: renew })) {
      expect(button.getAttribute('aria-disabled')).toBe('true')
      fireEvent.click(button)
    }
    expect(subscribe).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', {
        name: messages.shopifyPlanRequired.choosePlan,
      })
    ).toBeNull()
  })
  it('disables renewal while a subscription request is already pending', () => {
    const { subscribe } = renderTab(locale, {
      busy: true,
      number: { status: 'unconnected', connected: false },
    })
    const button = screen
      .getByRole('alert')
      .querySelector('button[aria-busy="true"]')!
    expect(button.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(button)
    expect(subscribe).not.toHaveBeenCalled()
  })
})
