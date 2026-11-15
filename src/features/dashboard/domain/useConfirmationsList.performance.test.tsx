import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/lib/auth'
import { useConfirmationsList } from './useConfirmationsList'

vi.mock('@/shared/lib/auth', () => ({ api: { get: vi.fn() } }))
vi.mock('@/features/orders', () => ({
  usePendingManualOrders: () => ({ pendingOrders: [] }),
}))
vi.mock('../api/verificationMutations', () => ({
  useAutoCancelExclusionMutation: () => ({ mutateAsync: vi.fn() }),
  useCancelVerificationMutation: () => ({ mutateAsync: vi.fn() }),
  useRetryVerificationMutation: () => ({ mutateAsync: vi.fn() }),
}))

describe('current confirmations screen readiness diagnostics', () => {
  afterEach(() => vi.restoreAllMocks())
  it.each([false, true])(
    'reports readiness only when opted in: %s',
    async (enabled) => {
      window.history.replaceState(
        null,
        '',
        `/en/dashboard${enabled ? '?akeed_perf=1' : ''}`
      )
      const debug = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => undefined)
      vi.mocked(api.get).mockResolvedValue({
        data: [],
        next_cursor: null,
        total_count: 0,
      })
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      )
      const view = renderHook(
        () => useConfirmationsList({ dateRange: 'last_30_days', tab: 'all' }),
        { wrapper }
      )
      await waitFor(() => expect(view.result.current.isLoading).toBe(false))
      if (enabled)
        expect(debug).toHaveBeenCalledWith(
          '[Akeed performance]',
          expect.objectContaining({
            metric: 'dashboard-confirmations-ready',
            path: '/en/dashboard',
          })
        )
      else expect(debug).not.toHaveBeenCalled()
      view.unmount()
      client.clear()
    }
  )
})
