import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReleaseOutcomeSync } from './useReleaseOutcomeSync'
import { useImportOutcomeSync } from './useImportOutcomeSync'

const queries = vi.hoisted(() => ({
  active: vi.fn(),
  detail: vi.fn(),
}))

vi.mock('../api/orderImportQueries', () => ({
  activeImportsOptions: () => ({
    queryKey: ['orderImports', 'active'],
    queryFn: queries.active,
  }),
  orderImportDetailOptions: (batchId: string) => ({
    queryKey: ['orderImports', 'detail', batchId],
    queryFn: () => queries.detail(batchId),
  }),
}))

vi.mock('./useBulkImportAvailability', () => ({
  useBulkImportAvailability: () => 'enabled',
}))

vi.mock('./useReleaseOutcomeSync', () => ({
  useReleaseOutcomeSync: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('useImportOutcomeSync', () => {
  it('continues syncing the active batch without a progress component', async () => {
    const detail = { batchId: 'active-batch', status: 'releasing' }
    queries.active.mockResolvedValue({
      batches: [
        { batchId: 'completed-batch', status: 'completed' },
        { batchId: 'active-batch', status: 'releasing' },
      ],
    })
    queries.detail.mockResolvedValue(detail)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const hook = renderHook(() => useImportOutcomeSync(), { wrapper })

    await waitFor(() =>
      expect(queries.detail).toHaveBeenCalledWith('active-batch')
    )
    await waitFor(() =>
      expect(useReleaseOutcomeSync).toHaveBeenCalledWith(detail)
    )

    act(() => hook.unmount())
    queryClient.clear()
  })
})
