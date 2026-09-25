import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/http'
import type {
  OrderImportBatchDetail,
  OrderImportStartQuote,
} from '../api/orderImportsApi'
import { useSendStep } from './useSendStep'

const api = vi.hoisted(() => ({
  getOrderImportStartQuote: vi.fn(),
  commitOrderImport: vi.fn(),
  startOrderImport: vi.fn(),
}))

vi.mock('../api/orderImportsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/orderImportsApi')>()),
  ...api,
}))

const BATCH = '0b8f7a52-6c1e-4f5e-9a39-2d6c1f0e7b11'

function detail(
  overrides: Partial<OrderImportBatchDetail> = {}
): OrderImportBatchDetail {
  return {
    batchId: BATCH,
    status: 'draft',
    mappingConfirmed: true,
    counts: { ready: 5, excluded: 4 },
    expiresAt: '2026-09-26T09:00:00Z',
    permissions: { canEdit: true },
    ...overrides,
  } as OrderImportBatchDetail
}

function quote(
  overrides: Partial<OrderImportStartQuote> = {}
): OrderImportStartQuote {
  return {
    batchId: BATCH,
    orders: 5,
    accountingMode: 'prepaid_credit',
    creditsAvailable: 457,
    slotsRemaining: null,
    estimatedCreditsMin: 5,
    estimatedCreditsMax: 10,
    ratePerMinute: 20,
    estimatedDurationMinutes: 1,
    quietHours: { enabled: false, start: null, end: null, timezone: 'UTC' },
    startDeadlineAt: null,
    blockers: [],
    quoteToken: 'draft-token',
    quoteExpiresAt: '2026-09-25T10:10:00Z',
    attestation: {
      version: 'bulk-import-consent-v1',
      text: { en: 'I confirm…', ar: 'أؤكد…' },
    },
    ...overrides,
  }
}

function setup(initial: OrderImportBatchDetail) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onDone = vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    ({ batch }: { batch: OrderImportBatchDetail }) =>
      useSendStep(batch, onDone),
    { wrapper, initialProps: { batch: initial } }
  )
  return { ...hook, onDone }
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getOrderImportStartQuote.mockResolvedValue(quote())
})

describe('useSendStep', () => {
  it('prices the draft and waits for consent before sending', async () => {
    const { result } = setup(detail())
    await waitFor(() => expect(result.current.quote.data).toBeDefined())
    expect(result.current.canSend).toBe(false)
    expect(result.current.canImportOnly).toBe(true)
    act(() => result.current.setAgreed(true))
    expect(result.current.canSend).toBe(true)
  })

  it('never sends without consent', async () => {
    const { result } = setup(detail())
    await waitFor(() => expect(result.current.quote.data).toBeDefined())
    act(() => result.current.submit(true))
    expect(api.commitOrderImport).not.toHaveBeenCalled()
  })

  it('imports only, then reports the import', async () => {
    api.commitOrderImport.mockResolvedValue(detail({ status: 'committing' }))
    const { result, rerender, onDone } = setup(detail())
    await waitFor(() => expect(result.current.quote.data).toBeDefined())
    act(() => result.current.submit(false))
    await waitFor(() => expect(api.commitOrderImport).toHaveBeenCalled())
    expect(result.current.phase).toBe('importing')
    rerender({
      batch: detail({ status: 'awaiting_start', counts: { imported: 5 } }),
    })
    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({ kind: 'imported', count: 5 })
    )
    expect(api.startOrderImport).not.toHaveBeenCalled()
  })

  it('imports, then starts with the token the merchant saw', async () => {
    api.commitOrderImport.mockResolvedValue(detail({ status: 'committing' }))
    api.startOrderImport.mockResolvedValue(
      detail({ status: 'releasing', counts: { imported: 5 } })
    )
    const { result, rerender, onDone } = setup(detail())
    await waitFor(() => expect(result.current.quote.data).toBeDefined())
    act(() => result.current.setAgreed(true))
    act(() => result.current.submit(true))
    await waitFor(() => expect(api.commitOrderImport).toHaveBeenCalled())
    rerender({
      batch: detail({ status: 'awaiting_start', counts: { imported: 5 } }),
    })
    await waitFor(() =>
      expect(api.startOrderImport).toHaveBeenCalledWith(BATCH, {
        attestationVersion: 'bulk-import-consent-v1',
        quoteToken: 'draft-token',
      })
    )
    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({ kind: 'sent', count: 5 })
    )
  })

  it('shows the fresh quote and asks again when the import changed N', async () => {
    api.commitOrderImport.mockResolvedValue(detail({ status: 'committing' }))
    const fresh = quote({ orders: 4, quoteToken: 'fresh-token' })
    api.startOrderImport.mockRejectedValue(
      Object.assign(new ApiError('stale', 409, 'IMPORT_QUOTE_STALE'), {
        quote: fresh,
      })
    )
    const { result, rerender, onDone } = setup(detail())
    await waitFor(() => expect(result.current.quote.data).toBeDefined())
    act(() => result.current.setAgreed(true))
    act(() => result.current.submit(true))
    await waitFor(() => expect(api.commitOrderImport).toHaveBeenCalled())
    // Imported, the server now prices the four held orders.
    api.getOrderImportStartQuote.mockResolvedValue(fresh)
    rerender({ batch: detail({ status: 'awaiting_start' }) })
    await waitFor(() => expect(result.current.notice).toBe('stale'))
    expect(result.current.phase).toBe('review')
    expect(result.current.agreed).toBe(false)
    expect(result.current.quote.data?.orders).toBe(4)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('does not start a batch another tab imported', async () => {
    const { result, rerender } = setup(detail({ status: 'committing' }))
    expect(result.current.phase).toBe('importing')
    rerender({ batch: detail({ status: 'awaiting_start' }) })
    await waitFor(() => expect(result.current.phase).toBe('review'))
    expect(api.startOrderImport).not.toHaveBeenCalled()
  })
})
