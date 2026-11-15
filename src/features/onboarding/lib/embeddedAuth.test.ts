import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOnboardingState, OnboardingApiError } from '../api/onboardingApi'
import {
  clearEmbeddedAuthCaches,
  ensureEmbeddedInstall,
  fetchEmbeddedOnboardingState,
  getCachedInstallStatus,
  getCachedOnboardingStatus,
  getEmbeddedAuthScope,
  isCurrentEmbeddedAuthScope,
  resolveOnboardingRedirect,
} from './embeddedAuth'
import { primeShopifySessionToken } from '@/shared/lib/auth'
import type { ShopifyGlobal } from '@/shared/types/window.model'

vi.mock('../api/onboardingApi', () => ({
  fetchOnboardingState: vi.fn(),
  OnboardingApiError: class extends Error {
    constructor(
      message: string,
      readonly status: number
    ) {
      super(message)
    }
  },
}))
vi.mock('@/shared/lib/auth', () => ({ primeShopifySessionToken: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const fullState = {
  state: {
    onboardingStatus: 'completed',
    permissions: { canUpdateConfiguration: false },
  },
} as Awaited<ReturnType<typeof fetchOnboardingState>>
function navigate(shop = 'synthetic', host = 'host-a') {
  window.history.replaceState(
    null,
    '',
    `/ar/dashboard?shop=${shop}.myshopify.com&host=${host}`
  )
}
let bridge: ShopifyGlobal
let fetchMock: ReturnType<typeof vi.fn>

describe('embedded startup request ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigate()
    clearEmbeddedAuthCaches()
    bridge = {
      idToken: vi.fn().mockResolvedValue('synthetic-token'),
    } as unknown as ShopifyGlobal
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ installed: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(fetchOnboardingState).mockResolvedValue(fullState)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('coalesces installation and preserves the warm install cache', async () => {
    await Promise.all([
      ensureEmbeddedInstall('synthetic.myshopify.com', bridge),
      ensureEmbeddedInstall('synthetic.myshopify.com', bridge),
    ])
    expect(bridge.idToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(primeShopifySessionToken).toHaveBeenCalledWith('synthetic-token')
    await ensureEmbeddedInstall('synthetic.myshopify.com', bridge)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('coalesces full onboarding envelopes without retaining completed promises', async () => {
    const [first, second] = await Promise.all([
      fetchEmbeddedOnboardingState(),
      fetchEmbeddedOnboardingState(),
    ])
    expect(first).toBe(fullState)
    expect(second).toBe(first)
    expect(fetchOnboardingState).toHaveBeenCalledTimes(1)
    expect(getCachedOnboardingStatus()).toBe('completed')
    await fetchEmbeddedOnboardingState()
    expect(fetchOnboardingState).toHaveBeenCalledTimes(2)
  })

  it('never caches pending status and preserves redirect decisions', async () => {
    vi.mocked(fetchOnboardingState).mockResolvedValue({
      state: { onboardingStatus: 'pending' },
    } as never)
    await fetchEmbeddedOnboardingState()
    expect(getCachedOnboardingStatus()).toBeNull()
    expect(
      resolveOnboardingRedirect({
        onboardingGate: 'dashboard',
        onboardingStatus: 'pending',
      })
    ).toBe('onboarding')
    expect(
      resolveOnboardingRedirect({
        onboardingGate: 'onboarding',
        onboardingStatus: 'completed',
      })
    ).toBe('dashboard')
  })

  it('falls back to the install check after a refused exchange', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }))
    expect(await ensureEmbeddedInstall('synthetic.myshopify.com', bridge)).toBe(
      true
    )
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/auth/shopify/token-exchange',
      '/api/auth/shopify/check?shop=synthetic.myshopify.com',
    ])
  })

  it('releases failed install attempts for a subsequent retry', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 403 }))
      .mockResolvedValueOnce(new Response('{}', { status: 403 }))
    expect(await ensureEmbeddedInstall('synthetic.myshopify.com', bridge)).toBe(
      false
    )
    expect(await ensureEmbeddedInstall('synthetic.myshopify.com', bridge)).toBe(
      true
    )
    expect(bridge.idToken).toHaveBeenCalledTimes(2)
  })

  it('retries transient onboarding failures with the existing bounded backoff', async () => {
    vi.useFakeTimers()
    vi.mocked(fetchOnboardingState)
      .mockRejectedValueOnce(new OnboardingApiError('unavailable', 503, null))
      .mockRejectedValueOnce(new OnboardingApiError('unavailable', 503, null))
    const pending = fetchEmbeddedOnboardingState()
    await vi.advanceTimersByTimeAsync(1050)
    expect(await pending).toBe(fullState)
    expect(fetchOnboardingState).toHaveBeenCalledTimes(3)
  })

  it('does not retry permission failures and can retry after failure', async () => {
    vi.mocked(fetchOnboardingState).mockRejectedValueOnce(
      new OnboardingApiError('forbidden', 403, null)
    )
    await expect(fetchEmbeddedOnboardingState()).rejects.toThrow('forbidden')
    expect(await fetchEmbeddedOnboardingState()).toBe(fullState)
  })

  it.each(['shop', 'host', 'reset'])(
    'rejects stale onboarding results after %s changes',
    async (change) => {
      const pending = deferred<typeof fullState>()
      vi.mocked(fetchOnboardingState).mockReturnValueOnce(pending.promise)
      const oldScope = getEmbeddedAuthScope()
      const old = fetchEmbeddedOnboardingState()
      const rejected = expect(old).rejects.toMatchObject({ name: 'AbortError' })
      if (change === 'reset') clearEmbeddedAuthCaches()
      else
        navigate(
          change === 'shop' ? 'another' : 'synthetic',
          change === 'host' ? 'host-b' : 'host-a'
        )
      expect(isCurrentEmbeddedAuthScope(oldScope)).toBe(false)
      const current = fetchEmbeddedOnboardingState()
      pending.resolve(fullState)
      await rejected
      expect(await current).toBe(fullState)
      expect(fetchOnboardingState).toHaveBeenCalledTimes(2)
    }
  )

  it('cannot prime a new shop with a late session token', async () => {
    const token = deferred<string>()
    vi.mocked(bridge.idToken).mockReturnValueOnce(token.promise)
    const old = ensureEmbeddedInstall('synthetic.myshopify.com', bridge)
    const rejected = expect(old).rejects.toMatchObject({ name: 'AbortError' })
    navigate('another')
    token.resolve('old-token')
    await rejected
    expect(primeShopifySessionToken).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(getCachedInstallStatus('synthetic.myshopify.com')).toBeNull()
  })

  it('discards an installation result after reset', async () => {
    const response = deferred<Response>()
    fetchMock.mockReturnValueOnce(response.promise)
    const old = ensureEmbeddedInstall('synthetic.myshopify.com', bridge)
    const rejected = expect(old).rejects.toMatchObject({ name: 'AbortError' })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    clearEmbeddedAuthCaches()
    response.resolve(new Response(JSON.stringify({ installed: true })))
    await rejected
    expect(getCachedInstallStatus('synthetic.myshopify.com')).toBeNull()
  })
})
