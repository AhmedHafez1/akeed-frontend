import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import * as api from '@/features/onboarding/api/onboardingApi'
import type {
  IntegrationOnboardingState,
  OnboardingTestState,
  OnboardingTestStatus,
  SetupBlockedReason,
} from '@/features/onboarding/domain/onboarding.types'
import type { EasyOrdersConnectionDetails } from './easyOrders.types'
import { useEasyOrdersSetupFlow } from './useEasyOrdersSetupFlow'

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))

/** A router whose search params follow the real `window.history`. */
vi.mock('next/navigation', async () => {
  const React = await import('react')
  const subscribe = (onChange: () => void) => {
    window.addEventListener('test:location', onChange)
    window.addEventListener('popstate', onChange)
    return () => {
      window.removeEventListener('test:location', onChange)
      window.removeEventListener('popstate', onChange)
    }
  }
  return {
    usePathname: () => '/ar/onboarding',
    useRouter: () => nav,
    useSearchParams: () => {
      const search = React.useSyncExternalStore(
        subscribe,
        () => window.location.search
      )
      return React.useMemo(() => new URLSearchParams(search), [search])
    },
  }
})

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/features/onboarding/api/onboardingApi')
    >()
  return {
    ...original,
    fetchOnboardingState: vi.fn(),
    updateOnboardingSettings: vi.fn(),
    sendOnboardingTest: vi.fn(),
    fetchOnboardingTest: vi.fn(),
    skipOnboardingTest: vi.fn(),
    completeStandaloneOnboarding: vi.fn(),
  }
})

const mocked = vi.mocked(api)
let calls: string[] = []
const PHONE = '+201012345670'

function makeState(
  overrides: Partial<IntegrationOnboardingState> = {},
  blockedReasons: SetupBlockedReason[] = []
): IntegrationOnboardingState {
  return {
    integrationId: 'source-1',
    source: { platformType: 'easyorders', identity: 'easyorders:org' },
    onboardingStatus: 'pending',
    isOnboardingComplete: false,
    storeName: 'متجر نور',
    defaultLanguage: 'ar',
    isAutoVerifyEnabled: true,
    assumeCodWhenPaymentMissing: false,
    shippingCurrency: 'USD',
    avgShippingCost: 0,
    billingPlanId: 'starter',
    billingStatus: 'not_required',
    followUpEnabled: true,
    followUpDelayMinutes: 120,
    escalationEnabled: true,
    escalationDelayMinutes: 360,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Africa/Cairo',
    sendDelayMinutes: 0,
    merchantWhatsappPhone: null,
    permissions: { canUpdateConfiguration: true, canCompleteOnboarding: true },
    standaloneSetup: null,
    sourceSetup: {
      connectionState: 'connected',
      disconnectedAt: null,
      store: { reference: 'store-7f3a', verified: false },
      orderDefaults: { currency: 'EGP', phoneCountry: 'EG' },
      sender: { sender: 'akeed_shared', status: 'configured' },
      canComplete: blockedReasons.length === 0,
      blockedReasons,
    },
    ...overrides,
  }
}

function makeTest(status: OnboardingTestStatus): OnboardingTestState {
  const now = new Date().toISOString()
  return {
    phone: PHONE,
    language: 'ar',
    preview: {
      greeting: 'أهلًا {{customer}}',
      body: 'طلبك من {{store}}',
      totalLabel: 'الإجمالي: {{total}}',
      ending: 'أكّد طلبك',
      confirmButton: 'تأكيد الطلب',
      cancelButton: 'إلغاء الطلب',
    },
    sample: {
      customerName: 'أحمد',
      orderNumber: 'TEST-1',
      total: '250',
      currency: 'EGP',
      storeName: 'متجر نور',
    },
    test: {
      verificationId: 'v-1',
      status,
      sentAt: now,
      deliveredAt: null,
      readAt: null,
      confirmedAt: status === 'confirmed' ? now : null,
      canceledAt: null,
    },
    resendAvailableAt: null,
    sendsRemainingToday: 4,
    testConfirmedAt: null,
    testSkippedAt: null,
  }
}

const READY: EasyOrdersConnectionDetails = {
  storeId: 'store-7f3a',
  storeVerified: false,
  health: 'ok',
  webhookUrlHint: 'aB3_xZ',
  ordersSecretSet: true,
  statusSecretSet: true,
  currency: 'EGP',
  phoneCountry: 'EG',
  rejectedDeliveries: 0,
  connectedAt: '2026-10-03T10:00:00.000Z',
  disconnectedAt: null,
}

function renderFlow(connection: EasyOrdersConnectionDetails | null = READY) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
  return renderHook(
    (props: { connection: EasyOrdersConnectionDetails | null }) =>
      useEasyOrdersSetupFlow(props.connection, props.connection !== null),
    { wrapper, initialProps: { connection } }
  )
}

async function renderLoaded(connection = READY) {
  const view = renderFlow(connection)
  await waitFor(() => expect(view.result.current.state).not.toBeNull())
  return view
}

const stepInUrl = () => new URLSearchParams(window.location.search).get('step')

beforeEach(() => {
  calls = []
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/ar/onboarding')
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = History.prototype[method]
    vi.spyOn(window.history, method).mockImplementation(function (
      this: History,
      ...args: Parameters<History['pushState']>
    ) {
      original.apply(window.history, args)
      window.dispatchEvent(new Event('test:location'))
    })
  }
  vi.spyOn(console, 'error').mockImplementation(() => undefined)

  mocked.fetchOnboardingState.mockResolvedValue({ state: makeState() })
  mocked.updateOnboardingSettings.mockImplementation(async (payload) => {
    calls.push('settings')
    return {
      state: makeState({
        merchantWhatsappPhone: payload.merchantWhatsappPhone,
      }),
    }
  })
  mocked.sendOnboardingTest.mockImplementation(async () => {
    calls.push('test')
    return makeTest('sent')
  })
  mocked.fetchOnboardingTest.mockImplementation(async () => makeTest('sent'))
  mocked.skipOnboardingTest.mockImplementation(async () => {
    calls.push('skip')
    return makeTest('sent')
  })
  mocked.completeStandaloneOnboarding.mockImplementation(async () => {
    calls.push('complete')
    return {
      state: makeState({
        onboardingStatus: 'completed',
        isOnboardingComplete: true,
      }),
    }
  })
})

describe('useEasyOrdersSetupFlow', () => {
  it('reads nothing until the store is connected', () => {
    const view = renderFlow(null)

    expect(mocked.fetchOnboardingState).not.toHaveBeenCalled()
    expect(view.result.current.step).toBe('store')
    expect(view.result.current.isReady).toBe(false)
  })

  it('starts on the checklist, under the common step name', async () => {
    const view = await renderLoaded()

    expect(view.result.current.step).toBe('store')
    expect(stepInUrl()).toBe('store')
    expect(view.result.current.isReady).toBe(true)
    expect(view.result.current.checklist.every((item) => item.done)).toBe(true)
  })

  it.each([
    [{ ...READY, currency: null }, [] as SetupBlockedReason[]],
    [{ ...READY, ordersSecretSet: false }, [] as SetupBlockedReason[]],
    [READY, ['merchant_name_missing'] as SetupBlockedReason[]],
  ])(
    'holds the test while something is missing: %#',
    async (connection, blocked) => {
      mocked.fetchOnboardingState.mockResolvedValue({
        state: makeState({}, blocked),
      })
      const view = await renderLoaded(connection)

      act(() => view.result.current.phone.set(PHONE))
      await act(async () => {
        expect(await view.result.current.startTest()).toBe(false)
      })

      expect(view.result.current.isReady).toBe(false)
      expect(calls).toEqual([])
    }
  )

  it('never opens the test step from the URL while setup is blocked', async () => {
    window.history.replaceState(null, '', '/ar/onboarding?step=test')
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({ merchantWhatsappPhone: PHONE }, [
        'webhook_secrets_missing',
      ]),
    })
    const view = await renderLoaded()

    expect(view.result.current.step).toBe('store')
    await waitFor(() => expect(stepInUrl()).toBe('store'))
    expect(mocked.fetchOnboardingTest).not.toHaveBeenCalled()
  })

  it('rejects an incomplete number before anything is saved', async () => {
    const view = await renderLoaded()

    act(() => view.result.current.phone.set('+2010'))
    await act(async () => {
      expect(await view.result.current.startTest()).toBe(false)
    })

    expect(view.result.current.phone.error).toBeTruthy()
    expect(calls).toEqual([])
  })

  it('saves the number and sends the test, and does not complete yet', async () => {
    const view = await renderLoaded()

    act(() => view.result.current.phone.set(PHONE))
    await act(async () => {
      expect(await view.result.current.startTest()).toBe(true)
    })

    expect(calls).toEqual(['settings', 'test'])
    expect(mocked.updateOnboardingSettings).toHaveBeenCalledWith({
      storeName: 'متجر نور',
      defaultLanguage: 'ar',
      isAutoVerifyEnabled: true,
      merchantWhatsappPhone: PHONE,
    })
    await waitFor(() => expect(view.result.current.step).toBe('test'))
    expect(stepInUrl()).toBe('test')
    expect(mocked.completeStandaloneOnboarding).not.toHaveBeenCalled()
  })

  it('completes once the test is confirmed and shows done in place', async () => {
    window.history.replaceState(null, '', '/ar/onboarding?step=test')
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({ merchantWhatsappPhone: PHONE }),
    })
    mocked.fetchOnboardingTest.mockImplementation(async () =>
      makeTest('confirmed')
    )
    const view = await renderLoaded()

    await waitFor(() => expect(view.result.current.step).toBe('done'))
    expect(calls).toEqual(['complete'])
    expect(stepInUrl()).toBe('done')
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('skips the test, completes, then goes to the dashboard', async () => {
    window.history.replaceState(null, '', '/ar/onboarding?step=test')
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({ merchantWhatsappPhone: PHONE }),
    })
    const view = await renderLoaded()
    await waitFor(() => expect(view.result.current.step).toBe('test'))

    await act(async () => {
      view.result.current.test.skip()
    })

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/ar/dashboard')
    )
    expect(calls).toEqual(['skip', 'complete'])
  })

  it('still opens the test step when the send fails, and says why there', async () => {
    mocked.sendOnboardingTest.mockRejectedValue(
      new api.OnboardingApiError('down', 503, 'ONBOARDING_TEST_UNAVAILABLE')
    )
    const view = await renderLoaded()

    act(() => view.result.current.phone.set(PHONE))
    await act(async () => {
      await view.result.current.startTest()
    })

    await waitFor(() => expect(view.result.current.step).toBe('test'))
    expect(
      view.result.current.test.error !== null ||
        view.result.current.test.isUnavailable
    ).toBe(true)
    expect(calls).toEqual(['settings'])
  })

  it('returns to the checklist with the reasons when completion is blocked', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({ merchantWhatsappPhone: PHONE }),
    })
    window.history.replaceState(null, '', '/ar/onboarding?step=test')
    mocked.completeStandaloneOnboarding.mockRejectedValue(
      new api.OnboardingApiError('blocked', 409, 'ONBOARDING_BLOCKED', [
        'webhook_secrets_missing',
      ])
    )
    const view = await renderLoaded()
    await waitFor(() => expect(view.result.current.step).toBe('test'))

    await act(async () => {
      view.result.current.test.continueToDashboard()
    })

    await waitFor(() => expect(view.result.current.step).toBe('store'))
    expect(view.result.current.blockedReasons).toEqual([
      'webhook_secrets_missing',
    ])
    expect(view.result.current.isReady).toBe(false)
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('re-reads what blocks the finish when a setup input changes', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({}, ['webhook_secrets_missing']),
    })
    const view = await renderLoaded({ ...READY, statusSecretSet: false })
    expect(view.result.current.blockedReasons).toEqual([
      'webhook_secrets_missing',
    ])

    mocked.fetchOnboardingState.mockResolvedValue({ state: makeState() })
    view.rerender({ connection: READY })

    await waitFor(() => expect(view.result.current.isReady).toBe(true))
    expect(mocked.fetchOnboardingState).toHaveBeenCalledTimes(2)
  })

  it('does not let a viewer start the test', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({
        permissions: {
          canUpdateConfiguration: false,
          canCompleteOnboarding: false,
        },
      }),
    })
    const view = await renderLoaded()

    act(() => view.result.current.phone.set(PHONE))
    await act(async () => {
      expect(await view.result.current.startTest()).toBe(false)
    })

    expect(view.result.current.canManage).toBe(false)
    expect(calls).toEqual([])
  })
})
