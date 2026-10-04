import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchOnboardingState,
  rememberSignupSource,
} from '@/features/onboarding'
import { resolveOrganizationSourceMode } from '@/shared/config/commerceSources'
import {
  ensureStandaloneOrganization,
  getSupabaseClient,
} from '@/shared/lib/auth'
import { AuthGuard } from './AuthGuard'
import { renderAuth } from './authTestUtils'

const router = { replace: vi.fn(), push: vi.fn() }
let pathname = '/ar/dashboard'

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => pathname,
}))
vi.mock('@/shared/layout/FullPageLoader', () => ({
  FullPageLoader: () => <div data-testid="loader" />,
}))
vi.mock('@/shared/config/commerceSources', () => ({
  resolveOrganizationSourceMode: vi.fn(),
}))
vi.mock('@/shared/lib/auth', () => ({
  auth: {
    getDashboardPath: (locale: string) => `/${locale}/dashboard`,
    getLoginPath: (locale: string) => `/${locale}/login`,
    signOut: vi.fn(),
  },
  clearStandaloneOrganizationBootstrap: vi.fn(),
  ensureStandaloneOrganization: vi.fn(),
  getSupabaseClient: vi.fn(),
}))
vi.mock('@/features/onboarding', () => {
  class OnboardingApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code: string | null
    ) {
      super(message)
    }
  }
  return {
    OnboardingApiError,
    clearKnownOnboardingSource: vi.fn(),
    fetchOnboardingState: vi.fn(),
    rememberSignupSource: vi.fn(),
  }
})

const mockedState = vi.mocked(fetchOnboardingState)
const mockedMode = vi.mocked(resolveOrganizationSourceMode)
const mockedEnsure = vi.mocked(ensureStandaloneOrganization)

const user = { id: 'user-1', user_metadata: { signup_source: 'easyorders' } }

async function sourceMissing() {
  const { OnboardingApiError } = await import('@/features/onboarding')
  return new OnboardingApiError(
    'Commerce source was not found',
    404,
    'ONBOARDING_SOURCE_MISSING'
  )
}

function renderGuard() {
  return renderAuth(
    <AuthGuard>
      <div data-testid="protected" />
    </AuthGuard>
  )
}

describe('AuthGuard with a source-less organization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pathname = '/ar/dashboard'
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user } } }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    } as never)
    mockedEnsure.mockResolvedValue({} as never)
  })

  it('sends an account that chose a store platform to setup, where it connects', async () => {
    mockedMode.mockReturnValue('connect')
    mockedState.mockRejectedValue(await sourceMissing())

    renderGuard()

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/ar/onboarding')
    )
    expect(mockedMode).toHaveBeenCalledWith('easyorders')
    expect(screen.queryByTestId('protected')).toBeNull()
  })

  it('lets that account stay on setup', async () => {
    pathname = '/ar/onboarding'
    mockedMode.mockReturnValue('connect')
    mockedState.mockRejectedValue(await sourceMissing())

    renderGuard()

    await screen.findByTestId('protected')
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('tells setup which platform the account chose, so it mounts that connect skin', async () => {
    pathname = '/ar/onboarding'
    mockedMode.mockReturnValue('connect')
    mockedState.mockRejectedValue(await sourceMissing())

    renderGuard()

    await screen.findByTestId('protected')
    expect(vi.mocked(rememberSignupSource)).toHaveBeenCalledWith('easyorders')
  })

  it('still reports a missing source as a failed setup for a Standalone account', async () => {
    mockedMode.mockReturnValue('standalone')
    mockedState.mockRejectedValue(await sourceMissing())

    renderGuard()

    await screen.findByRole('alert')
    expect(router.replace).not.toHaveBeenCalled()
    expect(screen.queryByTestId('protected')).toBeNull()
  })

  it.each([
    ['a finished account with nothing to fix', undefined, '/ar/dashboard'],
    [
      'a finished account whose source reports nothing blocking',
      { blockedReasons: [] },
      '/ar/dashboard',
    ],
    [
      'a reconnected source that still needs its webhook secrets',
      { blockedReasons: ['webhook_secrets_missing'] },
      '/ar/settings?tab=store',
    ],
    [
      'a disconnected source',
      { blockedReasons: ['source_disconnected'] },
      '/ar/settings?tab=store',
    ],
  ])(
    'sends %s away from setup to where it belongs',
    async (_label, sourceSetup, destination) => {
      pathname = '/ar/onboarding'
      mockedMode.mockReturnValue('connect')
      mockedState.mockResolvedValue({
        state: { onboardingStatus: 'completed', sourceSetup },
      } as never)

      renderGuard()

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith(destination)
      )
    }
  )

  it('leaves a finished account with a source to fix on the page it asked for', async () => {
    pathname = '/ar/dashboard'
    mockedMode.mockReturnValue('connect')
    mockedState.mockResolvedValue({
      state: {
        onboardingStatus: 'completed',
        sourceSetup: { blockedReasons: ['source_disconnected'] },
      },
    } as never)

    renderGuard()

    await screen.findByTestId('protected')
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('keeps the existing redirects for an account that has a source', async () => {
    mockedMode.mockReturnValue('standalone')
    mockedState.mockResolvedValue({
      state: { onboardingStatus: 'pending' },
    } as never)

    renderGuard()

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/ar/onboarding')
    )
  })
})
