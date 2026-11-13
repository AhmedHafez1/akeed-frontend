import { StrictMode } from 'react'
import type { User } from '@supabase/supabase-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  api,
  auth,
  ensureStandaloneOrganization,
  getSupabaseClient,
} from '@/shared/lib/auth'
import { ApiError } from '@/shared/lib/http'
import {
  finishGoogleSignIn,
  readGoogleAttempt,
  startGoogleSignIn,
  type GoogleAttempt,
} from '@/shared/lib/googleOAuth'
import { renderAuth } from '@/shared/auth/authTestUtils'
import { GoogleAccountFlow } from './GoogleAccountFlow'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/signup/google',
  useRouter: () => router,
}))
vi.mock('@/shared/lib/auth', () => ({
  auth: {
    signOut: vi.fn(),
    getDashboardPath: (locale: string) => `/${locale}/dashboard`,
    getOnboardingPath: (locale: string) => `/${locale}/onboarding`,
    getLoginPath: (locale: string) => `/${locale}/login`,
  },
  api: { get: vi.fn() },
  clearStandaloneOrganizationBootstrap: vi.fn(),
  ensureStandaloneOrganization: vi.fn(),
  getSupabaseClient: vi.fn(),
}))
vi.mock('@/shared/lib/googleOAuth', () => ({
  finishGoogleSignIn: vi.fn(),
  clearGoogleAttempt: vi.fn(),
  saveGoogleAttempt: vi.fn(),
  readGoogleAttempt: vi.fn(() => null),
  startGoogleSignIn: vi.fn(),
}))
vi.mock('@/shared/auth/signup/reportCompleteRegistration', () => ({
  reportCompleteRegistration: vi.fn(),
}))
const user: User = {
  id: 'user-google',
  email: 'sara@example.com',
  created_at: new Date().toISOString(),
  user_metadata: { full_name: 'Sara' },
  app_metadata: {},
  aud: 'authenticated',
}
const attempt = (): GoogleAttempt => ({
  id: 'f2544092-3e69-4baf-8738-18705dde3191',
  startedAt: Date.now(),
  locale: 'en',
  intent: 'signup',
  source: 'standalone',
  returnTo: null,
  userId: user.id,
  phase: 'authenticated',
})
const updateUser = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(readGoogleAttempt).mockReturnValue(null)
  vi.mocked(finishGoogleSignIn).mockResolvedValue({ user, attempt: attempt() })
  vi.mocked(api.get).mockRejectedValue(
    new ApiError('missing', 403, 'ORGANIZATION_REQUIRED')
  )
  vi.mocked(ensureStandaloneOrganization).mockResolvedValue({
    created: true,
    organization: { id: 'org' },
  } as Awaited<ReturnType<typeof ensureStandaloneOrganization>>)
  vi.mocked(auth.signOut).mockResolvedValue(undefined)
  updateUser.mockResolvedValue({ data: { user }, error: null })
  vi.mocked(getSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      updateUser,
    },
  } as unknown as ReturnType<typeof getSupabaseClient>)
})

describe('Google account screens', () => {
  it('retries a backend dependency failure without reopening Google', async () => {
    vi.mocked(readGoogleAttempt).mockReturnValue(attempt())
    vi.mocked(api.get)
      .mockRejectedValueOnce(
        new ApiError('dependency', 503, 'AUTH_DEPENDENCY_UNAVAILABLE')
      )
      .mockResolvedValueOnce({ organization: { id: 'existing' } })
    renderAuth(<GoogleAccountFlow />, 'en')
    await screen.findByRole('heading', {
      name: 'Google sign-in did not finish',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/dashboard')
    )
    expect(startGoogleSignIn).not.toHaveBeenCalled()
  })
  it('starts a fresh Google attempt when a callback cannot be recovered', async () => {
    vi.mocked(finishGoogleSignIn).mockRejectedValueOnce(
      new Error('callback rejected')
    )
    vi.mocked(startGoogleSignIn).mockRejectedValueOnce(
      new Error('synthetic provider unavailable')
    )
    renderAuth(<GoogleAccountFlow />, 'en')
    await screen.findByRole('heading', {
      name: 'Google sign-in did not finish',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() =>
      expect(startGoogleSignIn).toHaveBeenCalledWith({
        locale: 'en',
        intent: 'login',
        source: undefined,
        returnTo: undefined,
      })
    )
  })
  it('prefills Google identity, requires explicit terms and focuses the first missing field', async () => {
    renderAuth(<GoogleAccountFlow />, 'en')
    await screen.findByRole('heading', { name: 'Finish creating your account' })
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe(
      'Sara'
    )
    expect(screen.getByText('sara@example.com')).toBeTruthy()
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
      false
    )
    fireEvent.click(screen.getByRole('button', { name: 'Continue to setup' }))
    expect(document.activeElement?.id).toBe('google-storeName')
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Store name'), {
      target: { value: 'Sara Store' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to setup' }))
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/onboarding')
    )
  })
  it('routes existing members without exposing completion or changing their organization under effect replay', async () => {
    vi.mocked(api.get).mockResolvedValue({ organization: { id: 'existing' } })
    renderAuth(
      <StrictMode>
        <GoogleAccountFlow />
      </StrictMode>,
      'en'
    )
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/dashboard')
    )
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
    expect(updateUser).not.toHaveBeenCalled()
  })
  it('asks an orgless login for its platform before store details', async () => {
    vi.mocked(finishGoogleSignIn).mockResolvedValue({
      user,
      attempt: { ...attempt(), source: null, intent: 'login' },
    })
    renderAuth(<GoogleAccountFlow />, 'en')
    await screen.findByRole('heading', {
      name: 'Where do your orders come from?',
    })
    fireEvent.click(screen.getByRole('button', { name: /No connected store/ }))
    await screen.findByRole('heading', { name: 'Finish creating your account' })
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
  })
  it('shows recoverable dependency errors and signs out before changing accounts', async () => {
    vi.mocked(api.get).mockRejectedValue(
      new ApiError('dependency', 503, 'AUTH_DEPENDENCY_UNAVAILABLE')
    )
    renderAuth(<GoogleAccountFlow />, 'en')
    await screen.findByRole('heading', {
      name: 'Google sign-in did not finish',
    })
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Use another account' }))
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/login')
    )
    expect(auth.signOut).toHaveBeenCalledOnce()
  })
})
