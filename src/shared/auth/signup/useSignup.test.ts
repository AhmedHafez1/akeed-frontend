import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, auth } from '@/shared/lib/auth'
import { COMPLETE_REGISTRATION_PATH } from './reportCompleteRegistration'
import { useSignup } from './useSignup'

vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/auth')>()
  return {
    ...actual,
    auth: { ...actual.auth, signUp: vi.fn() },
    api: { ...actual.api, post: vi.fn() },
  }
})

const signUp = vi.mocked(auth.signUp)
const post = vi.mocked(api.post)

const VALID = {
  fullName: 'Sara',
  storeName: 'Sara Store',
  email: 'sara@example.com',
  password: 'long-enough-1',
  terms: true,
}

function setup() {
  const onEmailSent = vi.fn()
  const onSignedIn = vi.fn()
  const hook = renderHook(() =>
    useSignup({ locale: 'en', onEmailSent, onSignedIn })
  )
  act(() => {
    for (const [field, value] of Object.entries(VALID)) {
      hook.result.current.setValue(field as keyof typeof VALID, value as never)
    }
  })
  return { hook, onEmailSent, onSignedIn }
}

describe('useSignup CompleteRegistration', () => {
  let fbq: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fbq = vi.fn()
    window.fbq = fbq
    post.mockResolvedValue({ accepted: true })
  })

  afterEach(() => {
    delete window.fbq
    vi.clearAllMocks()
  })

  it('fires once in the browser and once to the server with one event ID', async () => {
    signUp.mockResolvedValue({
      user: { id: 'user-1', identities: [{}] },
      session: null,
    } as never)
    const { hook, onEmailSent } = setup()

    await act(() => hook.result.current.submit())

    expect(onEmailSent).toHaveBeenCalledWith('sara@example.com')
    expect(fbq).toHaveBeenCalledTimes(1)
    const [, eventName, , options] = fbq.mock.calls[0]
    expect(eventName).toBe('CompleteRegistration')
    expect(post).toHaveBeenCalledTimes(1)
    const [path, body, init] = post.mock.calls[0]
    expect(path).toBe(COMPLETE_REGISTRATION_PATH)
    expect(body).toMatchObject({
      userId: 'user-1',
      eventId: (options as { eventID: string }).eventID,
      eventSourceUrl: `${window.location.origin}${window.location.pathname}`,
    })
    expect(init).toEqual({ keepalive: true })
  })

  it('still signs the merchant in when the server event fails', async () => {
    post.mockRejectedValue(new Error('network'))
    signUp.mockResolvedValue({
      user: { id: 'user-1', identities: [{}] },
      session: { access_token: 't' },
    } as never)
    const { hook, onSignedIn } = setup()

    await act(() => hook.result.current.submit())

    expect(onSignedIn).toHaveBeenCalledTimes(1)
    expect(hook.result.current.formError).toBeNull()
  })

  it('fires nothing for an email that is already registered', async () => {
    signUp.mockResolvedValue({
      user: { id: 'user-1', identities: [] },
      session: null,
    } as never)
    const { hook } = setup()

    await act(() => hook.result.current.submit())

    expect(hook.result.current.fieldErrors.email).toBe('emailRegistered')
    expect(fbq).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it('fires nothing when signup fails', async () => {
    signUp.mockRejectedValue(new Error('boom'))
    const { hook } = setup()

    await act(() => hook.result.current.submit())

    expect(hook.result.current.formError).toBe('failed')
    expect(fbq).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })
})
