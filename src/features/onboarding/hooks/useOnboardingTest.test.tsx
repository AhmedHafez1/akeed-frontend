import { useRef, useState, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/features/onboarding/api/onboardingApi'
import type {
  OnboardingTestState,
  OnboardingTestStatus,
} from '@/features/onboarding/domain/onboarding.types'
import { queryKeys } from '@/shared/query/keys'
import { useOnboardingTest } from './useOnboardingTest'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/features/onboarding/api/onboardingApi')
    >()
  return {
    ...original,
    fetchOnboardingTest: vi.fn(),
    sendOnboardingTest: vi.fn(),
    skipOnboardingTest: vi.fn(),
  }
})

const mocked = vi.mocked(api)

function makeTestState(
  status: OnboardingTestStatus | null,
  overrides: Partial<OnboardingTestState> = {}
): OnboardingTestState {
  const now = new Date().toISOString()
  return {
    phone: '+201012345670',
    language: 'ar',
    message: templateMessageFixture(
      [
        'أهلًا {{customer}}',
        'طلبك {{order}}',
        'الإجمالي {{total}}',
        'أكّد الطلب',
      ],
      ['تأكيد الطلب', 'إلغاء الطلب'],
      { direction: 'rtl' }
    ),
    sample: {
      customerName: 'أحمد',
      orderNumber: 'TEST-1',
      total: '250.00',
      currency: 'EGP',
      storeName: 'متجر نور',
    },
    test: status
      ? {
          verificationId: 'verification-1',
          status,
          sentAt: now,
          deliveredAt: null,
          readAt: null,
          confirmedAt: status === 'confirmed' ? now : null,
          canceledAt: status === 'canceled' ? now : null,
        }
      : null,
    resendAvailableAt: null,
    sendsRemainingToday: 5,
    // Standalone has no Shopify install lifecycle, so this is always null.
    testConfirmedAt: null,
    testSkippedAt: null,
    ...overrides,
  }
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('useOnboardingTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.sendOnboardingTest.mockResolvedValue(makeTestState('sent'))
  })

  it('stays idle while inactive, even when another flow caches a confirmed test', async () => {
    const { queryClient, wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState('confirmed'))
    const onAnswered = vi.fn()

    // Mirrors the embedded flow: its own confirmation would activate it,
    // and an active auto-send hook sends when nothing is open.
    renderHook(
      () => {
        const [isActive, setIsActive] = useState(false)
        const freshSendRequestedRef = useRef(false)
        return useOnboardingTest({
          isActive,
          freshSendRequestedRef,
          onAnswered: () => {
            onAnswered()
            setIsActive(true)
          },
          onSkipped: vi.fn(),
        })
      },
      { wrapper }
    )

    // The standalone flow's poll lands a confirmed test in the shared cache.
    act(() => {
      queryClient.setQueryData(
        queryKeys.onboarding.test(),
        makeTestState('confirmed')
      )
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(onAnswered).not.toHaveBeenCalled()
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('does not auto-send when the latest test is already confirmed', async () => {
    const { wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState('confirmed'))
    const onAnswered = vi.fn()

    renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef: { current: false },
          onAnswered,
          onSkipped: vi.fn(),
        }),
      { wrapper }
    )

    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered).toHaveBeenCalledWith('confirmed')
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('treats Cancel as an answer: reports it once and sends nothing', async () => {
    const { wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState('canceled'))
    const onAnswered = vi.fn()

    renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef: { current: false },
          onAnswered,
          onSkipped: vi.fn(),
        }),
      { wrapper }
    )

    await waitFor(() => expect(onAnswered).toHaveBeenCalledWith('canceled'))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('reports the answer to a resent message after an earlier answer', async () => {
    const { wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState('confirmed'))
    mocked.sendOnboardingTest.mockResolvedValue(makeTestState('canceled'))
    const onAnswered = vi.fn()

    const { result } = renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef: { current: false },
          onAnswered,
          onSkipped: vi.fn(),
          autoSend: false,
        }),
      { wrapper }
    )
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))

    act(() => result.current.resend())

    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(2))
    expect(onAnswered).toHaveBeenLastCalledWith('canceled')
  })

  it('drops a status poll that was in flight when a resend went out', async () => {
    const { queryClient, wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValueOnce(makeTestState('failed'))
    const onAnswered = vi.fn()

    const { result } = renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef: { current: false },
          onAnswered,
          onSkipped: vi.fn(),
          autoSend: false,
        }),
      { wrapper }
    )
    await waitFor(() =>
      expect(result.current.testState?.test?.status).toBe('failed')
    )

    // A poll about the previous message is still on the wire.
    let landStalePoll: (state: OnboardingTestState) => void = () => undefined
    mocked.fetchOnboardingTest.mockReturnValueOnce(
      new Promise<OnboardingTestState>((resolve) => {
        landStalePoll = resolve
      })
    )
    void queryClient.refetchQueries({ queryKey: queryKeys.onboarding.test() })
    await waitFor(() =>
      expect(mocked.fetchOnboardingTest).toHaveBeenCalledTimes(2)
    )

    act(() => result.current.resend())
    await waitFor(() =>
      expect(result.current.testState?.test?.status).toBe('sent')
    )
    await act(async () => {
      landStalePoll(makeTestState('canceled'))
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(result.current.testState?.test?.status).toBe('sent')
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('auto-sends once when no test is open', async () => {
    const { wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState(null))

    renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef: { current: false },
          onAnswered: vi.fn(),
          onSkipped: vi.fn(),
        }),
      { wrapper }
    )

    await waitFor(() =>
      expect(mocked.sendOnboardingTest).toHaveBeenCalledTimes(1)
    )
    expect(mocked.sendOnboardingTest.mock.calls[0]?.[0]).toEqual({
      resend: false,
    })
  })

  it('never auto-sends when autoSend is off', async () => {
    const { wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState(null))

    const { result } = renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef: { current: false },
          onAnswered: vi.fn(),
          onSkipped: vi.fn(),
          autoSend: false,
        }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.testState).not.toBeNull())
    expect(mocked.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('sends a fresh test when one was requested, even with an open test', async () => {
    const { wrapper } = setup()
    mocked.fetchOnboardingTest.mockResolvedValue(makeTestState('delivered'))
    const freshSendRequestedRef = { current: true }

    renderHook(
      () =>
        useOnboardingTest({
          isActive: true,
          freshSendRequestedRef,
          onAnswered: vi.fn(),
          onSkipped: vi.fn(),
        }),
      { wrapper }
    )

    await waitFor(() =>
      expect(mocked.sendOnboardingTest).toHaveBeenCalledTimes(1)
    )
    expect(freshSendRequestedRef.current).toBe(false)
  })
})
