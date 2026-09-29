import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import * as api from '@/features/onboarding/api/onboardingApi'
import type {
  IntegrationOnboardingState,
  OnboardingTestState,
  OnboardingTestStatus,
} from '@/features/onboarding/domain/onboarding.types'
import { useStandaloneOnboardingFlow } from './useStandaloneOnboardingFlow'

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

function makeState(
  overrides: Partial<IntegrationOnboardingState> = {}
): IntegrationOnboardingState {
  return {
    integrationId: 'source-1',
    source: { platformType: 'standalone', identity: 'standalone:org' },
    onboardingStatus: 'pending',
    isOnboardingComplete: false,
    storeName: 'متجر نور',
    defaultLanguage: 'auto',
    isAutoVerifyEnabled: true,
    assumeCodWhenPaymentMissing: false,
    shippingCurrency: 'USD',
    avgShippingCost: 0,
    billingPlanId: null,
    billingStatus: null,
    followUpEnabled: true,
    followUpDelayMinutes: 120,
    escalationEnabled: true,
    escalationDelayMinutes: 360,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Asia/Riyadh',
    sendDelayMinutes: 0,
    merchantWhatsappPhone: null,
    permissions: { canUpdateConfiguration: true, canCompleteOnboarding: true },
    standaloneSetup: {
      canComplete: true,
      blockedReasons: [],
      accountStatus: 'active',
    },
    ...overrides,
  }
}

function makeTest(status: OnboardingTestStatus | null): OnboardingTestState {
  const now = new Date().toISOString()
  return {
    phone: '+201012345670',
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
    test: status
      ? {
          verificationId: 'v-1',
          status,
          sentAt: now,
          deliveredAt: null,
          readAt: null,
          confirmedAt: status === 'confirmed' ? now : null,
          canceledAt: null,
        }
      : null,
    resendAvailableAt: null,
    sendsRemainingToday: 4,
    testConfirmedAt: null,
    testSkippedAt: null,
  }
}

function renderFlow() {
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
  return renderHook(() => useStandaloneOnboardingFlow(), { wrapper })
}

async function renderLoaded() {
  const view = renderFlow()
  await waitFor(() => expect(view.result.current.isLoading).toBe(false))
  return view
}

const stepInUrl = () => new URLSearchParams(window.location.search).get('step')

beforeEach(() => {
  calls = []
  nav.replace.mockReset()
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

  mocked.fetchOnboardingState.mockResolvedValue({ state: makeState() })
  mocked.updateOnboardingSettings.mockImplementation(async (payload) => {
    calls.push('settings')
    return {
      state: makeState({
        storeName: payload.storeName,
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

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStandaloneOnboardingFlow: resume', () => {
  it('starts at store while no number is saved, whatever the URL says', async () => {
    window.history.replaceState(null, '', '/ar/onboarding?step=test')
    const { result } = await renderLoaded()
    expect(result.current.step).toBe('store')
    await waitFor(() => expect(stepInUrl()).toBe('store'))
    expect(result.current.store.form.storeName).toBe('متجر نور')
  })

  it('resumes the test for a saved number without sending one', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({ merchantWhatsappPhone: '+201012345670' }),
    })
    const { result } = await renderLoaded()
    expect(result.current.step).toBe('test')
    await waitFor(() => expect(mocked.fetchOnboardingTest).toHaveBeenCalled())
    await waitFor(() => expect(stepInUrl()).toBe('test'))
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
    expect(mocked.completeStandaloneOnboarding).not.toHaveBeenCalled()
  })

  it('keeps the saved currency and timezone of a resumed setup', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({
        merchantWhatsappPhone: '+201012345670',
        shippingCurrency: 'SAR',
        timezone: 'Asia/Dubai',
      }),
    })
    window.history.replaceState(null, '', '/ar/onboarding?step=store')
    const { result } = await renderLoaded()
    expect(result.current.step).toBe('store')
    expect(result.current.store.form.currency).toBe('SAR')
    expect(result.current.store.form.timezone).toBe('Asia/Dubai')
  })

  it('sends a completed account to the dashboard', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({
        onboardingStatus: 'completed',
        isOnboardingComplete: true,
      }),
    })
    renderFlow()
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/ar/dashboard')
    )
  })
})

describe('useStandaloneOnboardingFlow: Your store', () => {
  it('validates before calling anything', async () => {
    const { result } = await renderLoaded()
    act(() => result.current.store.setStoreName(' '))
    let outcome: Awaited<ReturnType<typeof result.current.store.submit>>
    await act(async () => {
      outcome = await result.current.store.submit()
    })
    expect(outcome!).toEqual({ ok: false, firstInvalidField: 'storeName' })
    expect(result.current.store.fieldErrors.storeName).toBe(
      'اكتب اسم متجرك كما يعرفه عملاؤك.'
    )
    expect(result.current.store.fieldErrors.merchantWhatsappPhone).toMatch(
      /^الرقم ناقص\./
    )
    expect(calls).toEqual([])
  })

  it('infers currency from the number until a row is changed by hand', async () => {
    const { result } = await renderLoaded()
    act(() => result.current.store.setPhone('+966512345678'))
    expect(result.current.store.form.currency).toBe('SAR')
    act(() => result.current.store.setCurrency('USD'))
    act(() => result.current.store.setPhone('+201012345670'))
    expect(result.current.store.form.currency).toBe('USD')
  })

  it('saves settings, sends the test, then moves to test, in that order', async () => {
    const { result } = await renderLoaded()
    act(() => result.current.store.setPhone('+201012345670'))
    await act(async () => {
      await result.current.store.submit()
    })

    expect(calls).toEqual(['settings', 'test'])
    expect(mocked.updateOnboardingSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'متجر نور',
        merchantWhatsappPhone: '+201012345670',
        defaultLanguage: 'auto',
        shippingCurrency: 'EGP',
        isAutoVerifyEnabled: true,
        followUpEnabled: true,
        followUpDelayMinutes: 120,
        escalationDelayMinutes: 360,
        quietHoursEnabled: false,
        assumeCodWhenPaymentMissing: false,
      })
    )
    expect(window.history.pushState).toHaveBeenCalled()
    expect(result.current.step).toBe('test')
    expect(stepInUrl()).toBe('test')
    expect(result.current.test.testState?.test?.status).toBe('sent')
    expect(mocked.completeStandaloneOnboarding).not.toHaveBeenCalled()
  })

  it('keeps the values and stays on store when saving fails', async () => {
    mocked.updateOnboardingSettings.mockRejectedValue(
      new api.OnboardingApiError('boom', 500, null)
    )
    const { result } = await renderLoaded()
    act(() => result.current.store.setPhone('+201012345670'))
    await act(async () => {
      await result.current.store.submit()
    })
    expect(result.current.store.saveError).toBe(
      'تعذّر حفظ بيانات متجرك. بياناتك ما زالت هنا، حاول مرة أخرى.'
    )
    expect(result.current.step).toBe('store')
    expect(result.current.store.form.phone).toBe('+201012345670')
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('lets a viewer change nothing', async () => {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({
        permissions: {
          canUpdateConfiguration: false,
          canCompleteOnboarding: false,
        },
      }),
    })
    const { result } = await renderLoaded()
    expect(result.current.canManage).toBe(false)
    act(() => result.current.store.setPhone('+201012345670'))
    await act(async () => {
      await result.current.store.submit()
    })
    expect(calls).toEqual([])
  })
})

describe('useStandaloneOnboardingFlow: completion', () => {
  async function renderOnTest(status: OnboardingTestStatus = 'sent') {
    mocked.fetchOnboardingState.mockResolvedValue({
      state: makeState({ merchantWhatsappPhone: '+201012345670' }),
    })
    mocked.fetchOnboardingTest.mockImplementation(async () => makeTest(status))
    const view = await renderLoaded()
    await waitFor(() =>
      expect(view.result.current.test.testState).not.toBeNull()
    )
    return view
  }

  it('does not complete while the test is only waiting for a tap', async () => {
    const { result } = await renderOnTest('delivered')
    expect(result.current.step).toBe('test')
    expect(mocked.completeStandaloneOnboarding).not.toHaveBeenCalled()
  })

  it('completes on confirm and shows done in place, without navigating', async () => {
    const { result } = await renderOnTest('confirmed')
    await waitFor(() => expect(result.current.step).toBe('done'))
    expect(calls).toEqual(['complete'])
    expect(stepInUrl()).toBe('done')
    expect(window.history.replaceState).toHaveBeenCalled()
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('skips, then completes, then goes to the dashboard', async () => {
    const { result } = await renderOnTest()
    await act(async () => {
      result.current.test.skip()
    })
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/ar/dashboard')
    )
    expect(calls).toEqual(['skip', 'complete'])
  })

  it('completes and leaves when Akeed WhatsApp is unavailable', async () => {
    mocked.sendOnboardingTest.mockImplementation(async () => {
      calls.push('test')
      throw new api.OnboardingApiError(
        'down',
        502,
        'TEST_VERIFICATION_PROVIDER_FAILED'
      )
    })
    const { result } = await renderLoaded()
    act(() => result.current.store.setPhone('+201012345670'))
    await act(async () => {
      await result.current.store.submit()
    })
    expect(result.current.step).toBe('test')
    expect(result.current.test.isUnavailable).toBe(true)
    expect(mocked.completeStandaloneOnboarding).not.toHaveBeenCalled()

    await act(async () => {
      result.current.test.continueToDashboard()
    })
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/ar/dashboard')
    )
    expect(calls).toEqual(['settings', 'test', 'complete'])
  })

  it('surfaces /complete blockers and stays on the test', async () => {
    mocked.completeStandaloneOnboarding.mockRejectedValue(
      new api.OnboardingApiError('blocked', 409, 'ONBOARDING_BLOCKED', [
        'pilot_entitlement_missing',
      ])
    )
    const { result } = await renderOnTest('confirmed')
    await waitFor(() =>
      expect(result.current.blockedReasons).toEqual([
        'pilot_entitlement_missing',
      ])
    )
    expect(result.current.step).toBe('test')
  })

  it('goes back to store on change number without sending', async () => {
    const { result } = await renderOnTest()
    act(() => result.current.test.changeNumber())
    expect(result.current.step).toBe('store')
    expect(stepInUrl()).toBe('store')
    expect(result.current.store.form.phone).toBe('+201012345670')
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
  })
})
