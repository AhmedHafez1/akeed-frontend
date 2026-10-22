import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const supabase = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabase.createClient,
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((accept, refuse) => {
    resolve = accept
    reject = refuse
  })
  return { promise, resolve, reject }
}

const NOW = 1_800_000_000_000
function token(label: string, expiresAt = NOW + 60_000) {
  return `header.${btoa(JSON.stringify({ exp: expiresAt / 1000, label }))}.sig`
}

function visit(shop = 'one') {
  window.history.replaceState(
    {},
    '',
    `/en/dashboard?shop=${shop}.myshopify.com&host=synthetic-${shop}`
  )
}

describe('embedded session token acquisition', () => {
  let auth: typeof import('./auth')
  let idToken: ReturnType<typeof vi.fn<() => Promise<string>>>
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.supabase.test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-only')
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    visit()
    idToken = vi.fn<() => Promise<string>>().mockResolvedValue(token('fresh'))
    vi.stubGlobal('shopify', { idToken })
    fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    supabase.createClient.mockReturnValue({
      auth: { getSession: supabase.getSession },
    })
    supabase.getSession.mockResolvedValue({
      data: { session: { access_token: 'standalone-token' } },
    })
    auth = await import('./auth')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    window.sessionStorage.clear()
  })

  const headersOf = (init?: RequestInit) => new Headers(init?.headers)

  it('shares one acquisition across eight cold requests and reuses the warm cache', async () => {
    const pending = deferred<string>()
    idToken.mockReturnValue(pending.promise)
    const requests = Array.from({ length: 8 }, () =>
      auth.fetchWithAuth('/api/orders')
    )
    await vi.waitFor(() => expect(idToken).toHaveBeenCalledTimes(1))
    expect(fetchMock).not.toHaveBeenCalled()
    pending.resolve(token('shared'))
    await Promise.all(requests)
    await Promise.all(
      Array.from({ length: 8 }, () => auth.fetchWithAuth('/api/orders'))
    )
    expect(idToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(16)
    for (const [, init] of fetchMock.mock.calls) {
      expect(headersOf(init).get('Authorization')).toBe(
        `Bearer ${token('shared')}`
      )
    }
  })

  it('refreshes at the existing five-second expiry margin', async () => {
    auth.primeShopifySessionToken(token('primed'))
    vi.mocked(Date.now).mockReturnValue(NOW + 54_999)
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).not.toHaveBeenCalled()
    vi.mocked(Date.now).mockReturnValue(NOW + 55_000)
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).toHaveBeenCalledTimes(1)
  })

  it('does not add storage writes to warm-cache requests', async () => {
    auth.primeShopifySessionToken(token('primed'))
    const writes = vi.spyOn(Storage.prototype, 'setItem')
    await auth.fetchWithAuth('/api/orders')
    expect(writes).toHaveBeenCalledTimes(2)
    expect(idToken).not.toHaveBeenCalled()
  })

  it('retains the thirty-second fallback for an unparseable expiry', async () => {
    auth.primeShopifySessionToken('opaque-token')
    vi.mocked(Date.now).mockReturnValue(NOW + 29_999)
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).not.toHaveBeenCalled()
    vi.mocked(Date.now).mockReturnValue(NOW + 30_000)
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).toHaveBeenCalledTimes(1)
  })

  it('clears a failed shared acquisition so a later request can try again', async () => {
    const pending = deferred<string>()
    idToken.mockReturnValueOnce(pending.promise)
    const requests = [
      auth.fetchWithAuth('/api/orders'),
      auth.fetchWithAuth('/api/usage'),
    ]
    await vi.waitFor(() => expect(idToken).toHaveBeenCalledTimes(1))
    pending.reject(new Error('App Bridge unavailable'))
    await Promise.all(requests)
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).toHaveBeenCalledTimes(2)
  })

  it('clears an empty acquisition and does not cache it', async () => {
    idToken.mockResolvedValueOnce('')
    await auth.fetchWithAuth('/api/orders')
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).toHaveBeenCalledTimes(2)
  })

  it('shares the refresh after concurrent 401 responses', async () => {
    const old = token('old')
    const fresh = token('new')
    auth.primeShopifySessionToken(old)
    fetchMock.mockImplementation(
      async (_url, init) =>
        new Response('{}', {
          status:
            headersOf(init).get('Authorization') === `Bearer ${old}`
              ? 401
              : 200,
        })
    )
    idToken.mockResolvedValue(fresh)
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => auth.fetchWithAuth('/api/orders'))
    )
    expect(responses.every((response) => response.status === 200)).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(16)
    expect(idToken).toHaveBeenCalledTimes(1)
  })

  it('does not clear a newer token when an older 401 arrives late', async () => {
    const late = deferred<Response>()
    auth.primeShopifySessionToken(token('old'))
    fetchMock.mockReturnValueOnce(late.promise)
    const request = auth.fetchWithAuth('/api/orders')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    auth.primeShopifySessionToken(token('new'))
    late.resolve(new Response('{}', { status: 401 }))
    await request
    expect(idToken).not.toHaveBeenCalled()
    expect(headersOf(fetchMock.mock.calls[1][1]).get('Authorization')).toBe(
      `Bearer ${token('new')}`
    )
  })

  it('keeps an expiry refresh already running when an old request receives a 401', async () => {
    const late = deferred<Response>()
    const refresh = deferred<string>()
    auth.primeShopifySessionToken(token('old'))
    fetchMock.mockReturnValueOnce(late.promise)
    const oldRequest = auth.fetchWithAuth('/api/orders')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    vi.mocked(Date.now).mockReturnValue(NOW + 55_000)
    idToken.mockReturnValueOnce(refresh.promise)
    const newRequest = auth.fetchWithAuth('/api/usage')
    await vi.waitFor(() => expect(idToken).toHaveBeenCalledTimes(1))
    late.resolve(new Response('{}', { status: 401 }))
    await Promise.resolve()
    refresh.resolve(token('refreshed', NOW + 120_000))
    const responses = await Promise.all([oldRequest, newRequest])
    expect(responses.every((response) => response.status === 200)).toBe(true)
    expect(idToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    for (const [, init] of fetchMock.mock.calls.slice(1)) {
      expect(headersOf(init).get('Authorization')).toBe(
        `Bearer ${token('refreshed', NOW + 120_000)}`
      )
    }
  })

  it('keeps a newer priming generation even when App Bridge returns the same token', async () => {
    const late = deferred<Response>()
    auth.primeShopifySessionToken(token('same'))
    fetchMock.mockReturnValueOnce(late.promise)
    const request = auth.fetchWithAuth('/api/orders')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    auth.primeShopifySessionToken(token('same'))
    late.resolve(new Response('{}', { status: 401 }))
    await request
    expect(idToken).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries a request only once when the fresh token also receives a 401', async () => {
    auth.primeShopifySessionToken(token('old'))
    fetchMock.mockImplementation(
      async () => new Response('{}', { status: 401 })
    )
    expect((await auth.fetchWithAuth('/api/orders')).status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(idToken).toHaveBeenCalledTimes(1)
  })

  it('keeps a newer primed token when an older acquisition completes', async () => {
    const pending = deferred<string>()
    idToken.mockReturnValueOnce(pending.promise)
    const request = auth.fetchWithAuth('/api/orders')
    await vi.waitFor(() => expect(idToken).toHaveBeenCalledTimes(1))
    auth.primeShopifySessionToken(token('primed'))
    pending.resolve(token('stale'))
    await request
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).toHaveBeenCalledTimes(1)
    expect(
      fetchMock.mock.calls.every(
        ([, init]) =>
          headersOf(init).get('Authorization') === `Bearer ${token('primed')}`
      )
    ).toBe(true)
  })

  it('isolates shop contexts and discards an acquisition from the previous shop', async () => {
    const previous = deferred<string>()
    const current = deferred<string>()
    idToken
      .mockReturnValueOnce(previous.promise)
      .mockReturnValueOnce(current.promise)
    const oldRequest = auth.fetchWithAuth('/api/orders')
    const oldRejection = expect(oldRequest).rejects.toMatchObject({
      name: 'AbortError',
    })
    await vi.waitFor(() => expect(idToken).toHaveBeenCalledTimes(1))
    visit('two')
    const newRequest = auth.fetchWithAuth('/api/orders')
    await vi.waitFor(() => expect(idToken).toHaveBeenCalledTimes(2))
    previous.resolve(token('previous-shop'))
    await oldRejection
    const secondNewRequest = auth.fetchWithAuth('/api/usage')
    current.resolve(token('current-shop'))
    await Promise.all([newRequest, secondNewRequest])
    expect(idToken).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(
      fetchMock.mock.calls.every(
        ([, init]) =>
          headersOf(init).get('Authorization') ===
          `Bearer ${token('current-shop')}`
      )
    ).toBe(true)
  })

  it('does not retry an old request with another shop’s credentials', async () => {
    const pending = deferred<Response>()
    auth.primeShopifySessionToken(token('one'))
    fetchMock.mockReturnValueOnce(pending.promise)
    const request = auth.fetchWithAuth('/api/orders')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    visit('two')
    auth.primeShopifySessionToken(token('two'))
    pending.resolve(new Response('{}', { status: 401 }))
    expect((await request).status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(idToken).not.toHaveBeenCalled()
  })

  it('preserves standalone Supabase authentication', async () => {
    window.history.replaceState({}, '', '/en/dashboard')
    await auth.fetchWithAuth('/api/orders')
    expect(idToken).not.toHaveBeenCalled()
    expect(supabase.getSession).toHaveBeenCalledTimes(1)
    expect(headersOf(fetchMock.mock.calls[0][1]).get('Authorization')).toBe(
      'Bearer standalone-token'
    )
  })
})
