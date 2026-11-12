import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useOnboardingSettings } from './useOnboardingSettings'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const api = vi.hoisted(() => ({
  completeOnboardingSetup: vi.fn(),
  updateOnboardingSettings: vi.fn(),
}))
vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/onboarding/api/onboardingApi')
  >()),
  ...api,
}))
describe('Shopify setup result', () => {
  it.each([true, false])(
    'routes according to active-plan state (needsPlan=%s)',
    async (needsPlan) => {
      api.completeOnboardingSetup.mockResolvedValue({
        state: {
          activation: { needsPlan },
          billingStatus: needsPlan ? 'cancelled' : 'active',
        },
      })
      const setStep = vi.fn()
      const client = new QueryClient()
      const { result } = renderHook(
        () =>
          useOnboardingSettings({
            step: 'setup',
            setStep,
            setErrorBanner: vi.fn(),
            messages: {
              storeNameRequired: 'name',
              phoneInvalid: 'phone',
              setupSaveError: 'save',
            },
            hasCompletedInitRef: { current: false },
            initialStoreName: 'Synthetic',
            initialDefaultLanguage: 'ar',
            initialIsAutoVerifyEnabled: true,
            initialMerchantPhone: '+201001234567',
          }),
        {
          wrapper: ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={client}>
              {children}
            </QueryClientProvider>
          ),
        }
      )
      await act(() => result.current.handleSubmitSetup())
      expect(setStep).toHaveBeenCalledWith(needsPlan ? 'plans' : 'test')
      expect(setStep).not.toHaveBeenCalledWith('success')
    }
  )
})
