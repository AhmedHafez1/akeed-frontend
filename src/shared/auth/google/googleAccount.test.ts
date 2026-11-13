import type { User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  api,
  ensureStandaloneOrganization,
  getSupabaseClient,
} from '@/shared/lib/auth'
import { ApiError } from '@/shared/lib/http'
import { reportCompleteRegistration } from '@/shared/auth/signup/reportCompleteRegistration'
import { saveGoogleAttempt, type GoogleAttempt } from '@/shared/lib/googleOAuth'
import {
  completeGoogleAccount,
  hasGoogleOrganization,
  reportGoogleRegistration,
  validateGoogleAccount,
} from './googleAccount'

vi.mock('@/shared/lib/auth', () => ({
  api: { get: vi.fn() },
  ensureStandaloneOrganization: vi.fn(),
  clearStandaloneOrganizationBootstrap: vi.fn(),
  getSupabaseClient: vi.fn(),
}))
vi.mock('@/shared/lib/googleOAuth', () => ({ saveGoogleAttempt: vi.fn() }))
vi.mock('@/shared/auth/signup/reportCompleteRegistration', () => ({
  reportCompleteRegistration: vi.fn(),
}))
const user = {
  id: 'google-new',
  created_at: new Date().toISOString(),
  user_metadata: {},
} as User
const updateUser = vi.fn(),
  getUser = vi.fn()
const values = { fullName: ' Sara ', storeName: ' Store ', terms: true }
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockRejectedValue(
    new ApiError('no org', 403, 'ORGANIZATION_REQUIRED')
  )
  vi.mocked(ensureStandaloneOrganization).mockResolvedValue({
    created: true,
    organization: { id: 'org' },
  } as Awaited<ReturnType<typeof ensureStandaloneOrganization>>)
  getUser.mockResolvedValue({ data: { user }, error: null })
  updateUser.mockResolvedValue({ data: { user }, error: null })
  vi.mocked(getSupabaseClient).mockReturnValue({
    auth: { getUser, updateUser },
  } as unknown as ReturnType<typeof getSupabaseClient>)
})

describe('Google account completion', () => {
  it('does not provision if the profile response belongs to a changed identity', async () => {
    updateUser.mockResolvedValueOnce({
      data: { user: { ...user, id: 'changed-user' } },
      error: null,
    })
    await expect(
      completeGoogleAccount(user, attempt(), values)
    ).rejects.toThrow('PROFILE_UPDATE_FAILED')
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
  })
  it('requires a name, store and explicit terms acceptance', () => {
    expect(
      validateGoogleAccount({ fullName: ' ', storeName: '', terms: false })
    ).toEqual({
      fullName: 'fullNameRequired',
      storeName: 'storeNameRequired',
      terms: 'termsRequired',
    })
  })
  it('only the exact backend orgless error permits account creation', async () => {
    expect(await hasGoogleOrganization()).toBe(false)
    for (const error of [
      new ApiError('invalid role', 403, 'ORGANIZATION_ROLE_INVALID'),
      new ApiError('unavailable', 503, 'AUTH_DEPENDENCY_UNAVAILABLE'),
      new ApiError('no auth', 401),
    ]) {
      vi.mocked(api.get).mockRejectedValueOnce(error)
      await expect(hasGoogleOrganization()).rejects.toBe(error)
    }
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
  })
  it('preserves existing membership without changing profile, source or organization', async () => {
    vi.mocked(api.get).mockResolvedValue({ organization: { id: 'existing' } })
    expect(await completeGoogleAccount(user, attempt(), values)).toBe(true)
    expect(updateUser).not.toHaveBeenCalled()
    expect(ensureStandaloneOrganization).not.toHaveBeenCalled()
    expect(reportCompleteRegistration).not.toHaveBeenCalled()
  })
  it('updates only setup metadata before idempotent provisioning and reports new registration', async () => {
    const a = attempt()
    expect(await completeGoogleAccount(user, a, values)).toBe(false)
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Sara',
        company_name: 'Store',
        signup_source: 'standalone',
      },
    })
    expect(saveGoogleAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'provisioning', userId: user.id })
    )
    expect(ensureStandaloneOrganization).toHaveBeenCalledWith(user)
    expect(reportCompleteRegistration).toHaveBeenCalledWith(
      user.id,
      `google-registration-${user.id}`
    )
  })
  it('refuses account switching, disabled sources and unchecked terms before profile writes', async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: 'foreign-user' } },
      error: null,
    })
    await expect(
      completeGoogleAccount(user, attempt(), values)
    ).rejects.toThrow('SESSION_CHANGED')
    await expect(
      completeGoogleAccount(
        user,
        { ...attempt(), source: 'woocommerce' },
        values
      )
    ).rejects.toThrow('SOURCE_REQUIRED')
    await expect(
      completeGoogleAccount(user, attempt(), { ...values, terms: false })
    ).rejects.toThrow('INVALID')
    expect(updateUser).not.toHaveBeenCalled()
  })
  it('retries an ambiguous provisioning result using backend membership and a stable event ID', async () => {
    const a = attempt()
    vi.mocked(ensureStandaloneOrganization).mockRejectedValueOnce(
      new Error('connection lost')
    )
    await expect(completeGoogleAccount(user, a, values)).rejects.toThrow()
    expect(a.phase).toBe('provisioning')
    vi.mocked(api.get).mockResolvedValue({
      organization: { id: 'created-before-interruption' },
    })
    expect(await completeGoogleAccount(user, a, values)).toBe(true)
    expect(updateUser).toHaveBeenCalledTimes(1)
    expect(reportCompleteRegistration).toHaveBeenCalledWith(
      user.id,
      `google-registration-${user.id}`
    )
  })
  it('does not report a returning Google user as a new registration', () => {
    reportGoogleRegistration(
      { ...user, created_at: '2020-01-01T00:00:00Z' },
      { ...attempt(), phase: 'provisioning' }
    )
    reportGoogleRegistration(user, attempt())
    expect(reportCompleteRegistration).not.toHaveBeenCalled()
  })
})
