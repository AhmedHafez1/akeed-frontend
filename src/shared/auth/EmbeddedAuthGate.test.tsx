import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmbeddedAuthGate } from './EmbeddedAuthGate'
import { clearEmbeddedAuthCaches } from '@/features/onboarding/lib/embeddedAuth'
import { fetchOnboardingState } from '@/features/onboarding/api/onboardingApi'
import { activationStateOptions } from '@/features/dashboard/api/activationQueries'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import {
  confirmationsListOptions,
  verificationOverviewOptions,
} from '@/features/dashboard/api/verificationQueries'

const router = { replace: vi.fn() }
const bridge = {
  idToken: vi.fn().mockResolvedValue('synthetic-token'),
  loading: vi.fn(),
}
vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => router,
}))
vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({
    isEmbedded: true,
    isLoading: false,
    shopDomain: new URLSearchParams(window.location.search).get('shop'),
    hostParam: new URLSearchParams(window.location.search).get('host'),
    shopify: bridge,
  }),
}))
vi.mock(
  '@/features/onboarding',
  () => import('@/features/onboarding/lib/embeddedAuth')
)
vi.mock('@/features/onboarding/api/onboardingApi', () => ({
  fetchOnboardingState: vi.fn(),
  OnboardingApiError: class extends Error {},
}))
vi.mock('@/shared/lib/auth', () => ({
  primeShopifySessionToken: vi.fn(),
  api: { get: vi.fn() },
}))
const response = {
  state: {
    onboardingStatus: 'completed',
    permissions: { canUpdateConfiguration: false },
  },
}
function Activation() {
  const query = useQuery(activationStateOptions())
  return (
    <div>
      {query.data
        ? `ready:${String(query.data.permissions?.canUpdateConfiguration)}`
        : 'waiting'}
    </div>
  )
}
function tree(
  client: QueryClient,
  gate: 'dashboard' | 'landing' = 'dashboard'
) {
  return (
    <QueryClientProvider client={client}>
      <StrictMode>
        <EmbeddedAuthGate onboardingGate={gate}>
          <Activation />
        </EmbeddedAuthGate>
      </StrictMode>
    </QueryClientProvider>
  )
}
describe('embedded gate and dashboard cache integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    bridge.idToken.mockResolvedValue('synthetic-token')
    window.history.replaceState(
      null,
      '',
      '/ar/dashboard?shop=synthetic.myshopify.com&host=host-a'
    )
    clearEmbeddedAuthCaches()
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify({ installed: true }))
    )
    vi.mocked(fetchOnboardingState).mockResolvedValue(response as never)
    vi.mocked(api.get).mockResolvedValue(response)
  })
  afterEach(() => vi.restoreAllMocks())

  it.each(['ar', 'en'])(
    'seeds full state before %s dashboard mounts, including StrictMode replay',
    async (locale) => {
      window.history.replaceState(
        null,
        '',
        `/${locale}/dashboard?shop=synthetic.myshopify.com&host=host-a`
      )
      const client = new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: false } },
      })
      const view = render(tree(client))
      await screen.findByText('ready:false')
      expect(fetchOnboardingState).toHaveBeenCalledTimes(1)
      expect(api.get).toHaveBeenCalledTimes(2)
      expect(bridge.idToken).toHaveBeenCalledTimes(1)
      await waitFor(() =>
        expect(
          client.getQueryData(
            confirmationsListOptions({
              tab: 'all',
              dateRange: 'last_30_days',
              search: '',
            }).queryKey
          )
        ).toBeDefined()
      )
      expect(
        client.getQueryData(
          verificationOverviewOptions('last_30_days').queryKey
        )
      ).toBeDefined()
      expect(client.getQueryData(queryKeys.onboarding.state())).toEqual(
        response
      )
      view.unmount()
      render(tree(client))
      await screen.findByText('ready:false')
      expect(fetchOnboardingState).toHaveBeenCalledTimes(1)
      await act(async () => {
        await client.invalidateQueries({
          queryKey: queryKeys.onboarding.state(),
        })
      })
      expect(api.get).toHaveBeenCalledTimes(3)
      client.clear()
    }
  )

  it('retains root-entry redirect and preserves embedded parameters', async () => {
    window.history.replaceState(
      null,
      '',
      '/en?shop=synthetic.myshopify.com&host=host-a&akeed_perf=0'
    )
    const client = new QueryClient()
    render(tree(client, 'landing'))
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/en/dashboard?shop=synthetic.myshopify.com&host=host-a&akeed_perf=0'
      )
    )
    expect(screen.queryByText('ready:false')).toBeNull()
    expect(client.getQueryData(queryKeys.onboarding.state())).toEqual(response)
    client.clear()
  })

  it('redirects pending stores without mounting dashboard consumers', async () => {
    vi.mocked(fetchOnboardingState).mockResolvedValue({
      state: { onboardingStatus: 'pending' },
    } as never)
    const client = new QueryClient()
    render(tree(client))
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/ar/onboarding?shop=synthetic.myshopify.com&host=host-a'
      )
    )
    expect(api.get).not.toHaveBeenCalled()
    client.clear()
  })

  it('drops the old query cache and cannot render old permissions after a host change', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000 } },
    })
    const view = render(tree(client))
    await screen.findByText('ready:false')
    client.setQueryData(['private-old-data'], { secret: 'synthetic' })
    let resolve!: (value: never) => void
    vi.mocked(fetchOnboardingState).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    window.history.replaceState(
      null,
      '',
      '/ar/dashboard?shop=synthetic.myshopify.com&host=host-b'
    )
    view.rerender(tree(client))
    expect(screen.queryByText('ready:false')).toBeNull()
    await waitFor(() => expect(fetchOnboardingState).toHaveBeenCalledTimes(2))
    expect(client.getQueryData(['private-old-data'])).toBeUndefined()
    await act(async () => {
      resolve(response as never)
    })
    await screen.findByText('ready:false')
    client.clear()
  })
})
