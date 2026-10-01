import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as onboardingApi from '@/features/onboarding/api/onboardingApi'
import { ApiError } from '@/shared/lib/http'
import ar from '../../../../public/messages/ar.json'
import * as settingsApi from '../api/settingsApi'
import { settingsResponseFixture } from '../testing/settingsFixture'
import { useStandaloneSettings } from './useStandaloneSettings'

const nav = vi.hoisted(() => ({ replace: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/ar/settings',
  useRouter: () => ({ replace: nav.replace }),
}))

vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({
    mode: 'STANDALONE',
    isEmbedded: false,
    isStandalone: true,
    isLoading: false,
    shopify: null,
  }),
}))

vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/ui')>()),
  notify: toast,
}))

vi.mock('../api/settingsApi', () => ({
  fetchSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/features/onboarding/api/onboardingApi')
    >()
  return { ...original, sendOnboardingTest: vi.fn() }
})

const api = vi.mocked(settingsApi)
const sendOnboardingTest = vi.mocked(onboardingApi.sendOnboardingTest)
const copy = ar.settings.standalone.messages

async function setupLoaded() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  )
  const view = renderHook(() => useStandaloneSettings(), { wrapper })
  await waitFor(() => expect(view.result.current.values).not.toBeNull())
  return view
}

beforeEach(() => {
  vi.clearAllMocks()
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({
      state: {
        source: { platformType: 'standalone', identity: 'org-1' },
      },
    })
  )
  api.saveSettings.mockImplementation(async () => settingsResponseFixture())
})

describe('useStandaloneSettings', () => {
  it('toasts in Arabic when the settings are saved', async () => {
    const { result } = await setupLoaded()
    act(() => result.current.update({ storeName: 'متجر نور' }))

    await act(async () => {
      await result.current.save()
    })

    expect(toast.success).toHaveBeenCalledWith({ message: copy.saveSuccess })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('leaves a failed save to the page banner, without a toast', async () => {
    api.saveSettings.mockRejectedValue(new ApiError('boom', 500))
    const { result } = await setupLoaded()

    await act(async () => {
      await result.current.save()
    })

    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.saveError).toBe(copy.saveError)
  })

  it('toasts the test send result', async () => {
    sendOnboardingTest.mockRejectedValueOnce(
      new onboardingApi.OnboardingApiError(
        'slow down',
        429,
        'ONBOARDING_TEST_COOLDOWN'
      )
    )
    const { result } = await setupLoaded()

    await act(async () => {
      await result.current.sendTest()
    })
    expect(toast.error).toHaveBeenCalledWith({
      message: copy.testSendCooldown,
    })

    sendOnboardingTest.mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof onboardingApi.sendOnboardingTest>>
    )
    await act(async () => {
      await result.current.sendTest()
    })
    expect(toast.success).toHaveBeenCalledWith({
      message: copy.testSendSuccess,
    })
  })

  it('marks the Store tab when the order-source default changes', async () => {
    const { result } = await setupLoaded()

    act(() => result.current.update({ assumeCodWhenPaymentMissing: true }))

    expect([...result.current.dirtyTabs]).toEqual(['store'])
  })

  it('sends an account that has not finished setup to onboarding', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({ state: { onboardingStatus: 'pending' } })
    )
    const { result } = await setupLoaded()

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/ar/onboarding')
    )
    expect(result.current.isPageLoading).toBe(true)
  })
})
