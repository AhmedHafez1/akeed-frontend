import type { User } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveOrganizationSourceMode } from '@/shared/config/commerceSources'
import {
  clearStandaloneOrganizationBootstrap,
  ensureStandaloneOrganization,
} from './auth'

vi.mock('@/shared/config/commerceSources', () => ({
  resolveOrganizationSourceMode: vi.fn(),
}))

const mockedMode = vi.mocked(resolveOrganizationSourceMode)

function userWith(signupSource?: string): User {
  return {
    id: `user-${Math.random()}`,
    email: 'ahmed@noorstore.com',
    user_metadata: {
      company_name: 'متجر نور',
      ...(signupSource ? { signup_source: signupSource } : {}),
    },
  } as unknown as User
}

const created = () =>
  new Response(JSON.stringify({ organization: { id: 'org-1' }, created: true }))

describe('organization provisioning on first sign-in', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.clearAllMocks()
    clearStandaloneOrganizationBootstrap()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const bodies = () =>
    fetchMock.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>
    )

  it('asks for an organization without a source when signup chose a store platform', async () => {
    mockedMode.mockReturnValue('connect')
    fetchMock.mockResolvedValue(created())

    await ensureStandaloneOrganization(userWith('easyorders'))

    expect(mockedMode).toHaveBeenCalledWith('easyorders')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/organizations')
    expect(bodies()).toEqual([{ name: 'متجر نور', sourceMode: 'connect' }])
  })

  it('sends the unchanged Standalone request otherwise', async () => {
    mockedMode.mockReturnValue('standalone')
    fetchMock.mockResolvedValue(created())

    await ensureStandaloneOrganization(userWith())

    expect(bodies()).toEqual([{ name: 'متجر نور' }])
  })

  it('falls back to Standalone when the platform was switched off before anything was created', async () => {
    mockedMode.mockReturnValue('connect')
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'SOURCE_CONNECT_UNAVAILABLE', message: 'x' }),
          { status: 409 }
        )
      )
      .mockResolvedValueOnce(created())

    await ensureStandaloneOrganization(userWith('easyorders'))

    expect(bodies()).toEqual([
      { name: 'متجر نور', sourceMode: 'connect' },
      { name: 'متجر نور' },
    ])
  })

  it('does not fall back on any other failure', async () => {
    mockedMode.mockReturnValue('connect')
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 'STANDALONE_SOURCE_CONFLICT' }), {
        status: 409,
      })
    )

    await expect(
      ensureStandaloneOrganization(userWith('easyorders'))
    ).rejects.toMatchObject({ code: 'STANDALONE_SOURCE_CONFLICT' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
