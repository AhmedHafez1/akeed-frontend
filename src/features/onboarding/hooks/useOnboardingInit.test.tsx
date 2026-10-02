import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import * as onboardingApi from '@/features/onboarding/api/onboardingApi'
import type { IntegrationOnboardingState } from '@/features/onboarding/domain/onboarding.types'
import { useOnboardingInit } from './useOnboardingInit'

vi.mock('@/features/onboarding/api/onboardingApi', () => ({
  fetchOnboardingState: vi.fn(),
  fetchOnboardingBillingPlans: vi.fn(),
}))

const api = vi.mocked(onboardingApi)
const router = { replace: vi.fn() } as unknown as AppRouterInstance
const setStep = vi.fn()

function pendingState(
  phones: Pick<
    IntegrationOnboardingState,
    'merchantWhatsappPhone' | 'shopPhone'
  >
) {
  return {
    state: {
      onboardingStatus: 'pending',
      storeName: 'Togo',
      defaultLanguage: 'auto',
      isAutoVerifyEnabled: true,
      ...phones,
    } as IntegrationOnboardingState,
  }
}

function setup() {
  return renderHook(() =>
    useOnboardingInit({
      isEmbedded: true,
      isModeLoading: false,
      locale: 'ar',
      router,
      requestedStep: null,
      prefillWarningMessage: 'warning',
      setStep,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  api.fetchOnboardingBillingPlans.mockResolvedValue({
    isFreePlanClaimed: false,
  } as Awaited<ReturnType<typeof onboardingApi.fetchOnboardingBillingPlans>>)
})

describe('useOnboardingInit phone prefill', () => {
  it('starts from the store phone when no number is saved', async () => {
    api.fetchOnboardingState.mockResolvedValue(
      pendingState({ merchantWhatsappPhone: null, shopPhone: '+201001234567' })
    )
    const { result } = setup()

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false))

    expect(result.current.initialMerchantPhone).toBe('+201001234567')
    expect(setStep).toHaveBeenCalledWith('setup')
  })

  it('prefers the saved number over the store phone', async () => {
    api.fetchOnboardingState.mockResolvedValue(
      pendingState({
        merchantWhatsappPhone: '+966501234567',
        shopPhone: '+201001234567',
      })
    )
    const { result } = setup()

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false))

    expect(result.current.initialMerchantPhone).toBe('+966501234567')
  })

  it('is empty when neither is known', async () => {
    api.fetchOnboardingState.mockResolvedValue(
      pendingState({ merchantWhatsappPhone: null, shopPhone: null })
    )
    const { result } = setup()

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false))

    expect(result.current.initialMerchantPhone).toBe('')
  })
})
