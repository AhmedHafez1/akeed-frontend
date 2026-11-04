import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { usageFixture } from '../../../../test/fixtures/billing-usage'
import { useBillingUsage } from './useBillingUsage'

const mocks = vi.hoisted(() => ({ fetchUsage: vi.fn() }))
vi.mock('../api/billingApi', () => ({ fetchCreditUsage: mocks.fetchUsage }))
vi.mock('./useTransactions', () => ({
  useTransactions: () => ({ purchases: [] }),
}))

describe('server-based billing usage', () => {
  function setup() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    return { client, ...renderHook(() => useBillingUsage(), { wrapper }) }
  }
  it('uses actual mixed-sender credits without reading pack postings', async () => {
    mocks.fetchUsage.mockResolvedValue(usageFixture())
    const test = setup()
    await waitFor(() => expect(test.result.current.status).toBe('ready'))
    expect(test.result.current).toMatchObject({
      usedThisMonth: 3,
      daily: [...new Array(13).fill(0), 3],
    })
    test.unmount()
    test.client.clear()
  })
  it.each(['failure', 'partial'])(
    'shows unavailable for %s rather than a misleading zero',
    async (reason) => {
      if (reason === 'failure')
        mocks.fetchUsage.mockRejectedValue(new Error('synthetic unavailable'))
      else mocks.fetchUsage.mockResolvedValue({ ...usageFixture(), daily: [] })
      const test = setup()
      await waitFor(() =>
        expect(test.result.current.status).toBe('unavailable')
      )
      await act(async () => {
        test.unmount()
        test.client.clear()
      })
    }
  )
})
