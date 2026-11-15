import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import type { DashboardActivationState } from '../model/activation.model'
import { liveBannerDismissalKey } from '../lib/liveBannerDismissal'
import { DashboardActivationSection } from '../skins/embedded/components/DashboardActivationSection'
import { renderEmbedded } from '../skins/embedded/components/embeddedTestUtils'
import { useDashboardActivation } from './useDashboardActivation'

const auth = vi.hoisted(() => ({ api: { get: vi.fn() } }))
vi.mock('@/shared/lib/auth', () => auth)
vi.mock('@/features/billing', () => ({ UpgradePlansModal: () => null }))

const LIVE = 'Akeed is live. New COD orders will be verified automatically.'
const PAUSED =
  'Auto-confirm is off. Turn it on in settings so Akeed confirms your new orders.'
let sequence = 0

function state(): DashboardActivationState {
  return {
    integrationId: `activation-test-${++sequence}`,
    isAutoVerifyEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    billingPlanId: 'starter',
    activation: {
      setupCompletedAt: '2026-11-15T08:00:00Z',
      testSentAt: null,
      testConfirmedAt: null,
      testSkippedAt: null,
      firstRealConfirmedAt: null,
      isLive: true,
      needsPlan: false,
    },
  }
}

function Harness() {
  const activation = useDashboardActivation()
  return (
    <>
      <output data-testid="loaded">{String(activation.isLoaded)}</output>
      <output data-testid="first-run">{String(activation.isFirstRun)}</output>
      {(activation.showLiveBanner || activation.showPausedBanner) && (
        <DashboardActivationSection activation={activation} />
      )}
    </>
  )
}

function setup(value: DashboardActivationState, locale: 'en' | 'ar' = 'en') {
  auth.api.get.mockResolvedValue({ state: value })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const view = renderEmbedded(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
    locale
  )
  return { ...view, client }
}

beforeEach(() => {
  window.localStorage.clear()
  auth.api.get.mockReset()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('dashboard welcome banner', () => {
  it.each([
    ['en', LIVE, 'Dismiss'],
    [
      'ar',
      'أكيد يعمل الآن. سيتم التحقق من طلبات الدفع عند الاستلام الجديدة تلقائيًا.',
      'إخفاء',
    ],
  ] as const)(
    'shows the agreed %s copy after setup, even after a test confirmation',
    async (locale, copy, dismiss) => {
      const value = state()
      value.activation!.testConfirmedAt = '2026-11-15T08:01:00Z'
      setup(value, locale)
      expect(await screen.findByText(copy)).toBeTruthy()
      expect(screen.getByRole('button', { name: dismiss })).toBeTruthy()
    }
  )

  it('remembers dismissal after remount, without completing onboarding progress', async () => {
    const value = state()
    const view = setup(value)
    await screen.findByText(LIVE)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(LIVE)).toBeNull()
    expect(screen.getByTestId('first-run').textContent).toBe('true')
    view.unmount()
    setup(value)
    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    )
    expect(screen.queryByText(LIVE)).toBeNull()
  })

  it('does not share dismissal with another store or a new setup', async () => {
    const value = state()
    const view = setup(value)
    await screen.findByText(LIVE)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    const next = state()
    act(() =>
      view.client.setQueryData(queryKeys.onboarding.state(), { state: next })
    )
    await screen.findByText(LIVE)
    const restarted = {
      ...value,
      activation: {
        ...value.activation!,
        setupCompletedAt: '2026-11-16T08:00:00Z',
      },
    }
    act(() =>
      view.client.setQueryData(queryKeys.onboarding.state(), {
        state: restarted,
      })
    )
    expect(await screen.findByText(LIVE)).toBeTruthy()
  })

  it('hides after the first real confirmation arrives from the API', async () => {
    const value = state()
    const { client } = setup(value)
    await screen.findByText(LIVE)
    const confirmed = {
      ...value,
      activation: {
        ...value.activation!,
        firstRealConfirmedAt: '2026-11-15T09:00:00Z',
      },
    }
    act(() =>
      client.setQueryData(queryKeys.onboarding.state(), { state: confirmed })
    )
    await waitFor(() => expect(screen.queryByText(LIVE)).toBeNull())
    expect(screen.getByTestId('first-run').textContent).toBe('false')
  })

  it.each([
    'setup-incomplete',
    'needs-plan',
    'not-live',
    'sending-blocked',
  ] as const)('does not claim to be live when %s', async (scenario) => {
    const value = state()
    if (scenario === 'setup-incomplete')
      value.activation!.setupCompletedAt = null
    if (scenario === 'needs-plan') value.activation!.needsPlan = true
    if (scenario === 'not-live') value.activation!.isLive = false
    if (scenario === 'sending-blocked')
      value.sendingAvailability = {
        available: false,
      } as DashboardActivationState['sendingAvailability']
    setup(value)
    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    )
    expect(screen.queryByText(LIVE)).toBeNull()
    expect(screen.queryByText(PAUSED)).toBeNull()
  })

  it('keeps the paused warning after welcome dismissal and after activation', async () => {
    const value = state()
    const { client } = setup(value)
    await screen.findByText(LIVE)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    const paused = {
      ...value,
      isAutoVerifyEnabled: false,
      activation: {
        ...value.activation!,
        isLive: false,
        firstRealConfirmedAt: '2026-11-15T09:00:00Z',
      },
    }
    act(() =>
      client.setQueryData(queryKeys.onboarding.state(), { state: paused })
    )
    expect(await screen.findByText(PAUSED)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
  })

  it('dismisses for the current page when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    setup(state())
    await screen.findByText(LIVE)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(LIVE)).toBeNull()
    expect(warning).toHaveBeenCalledOnce()
  })

  it('still dismisses when reads work but storage writes fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setup(state())
    await screen.findByText(LIVE)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(LIVE)).toBeNull()
  })

  it('observes dismissal from another browser tab', async () => {
    const value = state()
    setup(value)
    await screen.findByText(LIVE)
    const key = liveBannerDismissalKey(
      value.integrationId,
      value.activation!.setupCompletedAt
    )!
    act(() => {
      window.localStorage.setItem(key, '1')
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: '1' }))
    })
    await waitFor(() => expect(screen.queryByText(LIVE)).toBeNull())
  })

  it('does not flash a welcome banner while the API is loading', async () => {
    auth.api.get.mockReturnValue(new Promise(() => undefined))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    renderEmbedded(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
      'en'
    )
    expect(screen.getByTestId('loaded').textContent).toBe('false')
    expect(screen.queryByText(LIVE)).toBeNull()
  })
})
