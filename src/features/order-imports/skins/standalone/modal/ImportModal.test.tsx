import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../../../public/messages/en.json'
import type {
  OrderImportBatchDetail,
  OrderImportBatchStatus,
} from '../../../api/orderImportsApi'
import type { ImportModalTarget } from '../../../domain/importRoutes'
import { ImportModalHost } from './ImportModal'

const BATCH = '0b8f7a52-6c1e-4f5e-9a39-2d6c1f0e7b11'

const api = vi.hoisted(() => ({
  getOrderImport: vi.fn(),
  discardOrderImport: vi.fn(),
  listOpenOrderImportDrafts: vi.fn(),
}))
const url = vi.hoisted(() => ({
  target: null as ImportModalTarget | null,
  open: vi.fn(),
  close: vi.fn(),
}))

vi.mock('../../../api/orderImportsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/orderImportsApi')>()),
  ...api,
}))
vi.mock('../../../domain/useBulkImportAvailability', () => ({
  useBulkImportAvailability: () => 'enabled',
}))
vi.mock('../../../domain/useImportModalUrl', () => ({
  useImportModalUrl: () => ({
    target: url.target,
    reopenStart: false,
    open: url.open,
    close: url.close,
    clearStart: vi.fn(),
  }),
}))
// The steps have their own tests; here only the modal's leave paths matter.
vi.mock('./ImportModalContent', () => ({
  ImportNewContent: () => <p>upload step</p>,
  ImportBatchContent: ({
    detail,
    onChangeFile,
  }: {
    detail: { data?: OrderImportBatchDetail }
    onChangeFile: () => void
  }) =>
    detail.data ? (
      <button type="button" onClick={onChangeFile}>
        {`change file (${detail.data.status})`}
      </button>
    ) : null,
}))

function batch(
  status: OrderImportBatchStatus,
  canEdit = true
): OrderImportBatchDetail {
  return {
    batchId: BATCH,
    status,
    mappingConfirmed: false,
    permissions: { canEdit },
  } as unknown as OrderImportBatchDetail
}

function renderModal(target: ImportModalTarget) {
  url.target = target
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en}>
        <ImportModalHost />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

async function openBatch(status: OrderImportBatchStatus, canEdit = true) {
  api.getOrderImport.mockResolvedValue(batch(status, canEdit))
  renderModal({ kind: 'batch', batchId: BATCH })
  return screen.findByRole('button', { name: `change file (${status})` })
}

const closeButton = () => screen.getByRole('button', { name: 'Close' })

beforeEach(() => {
  vi.clearAllMocks()
  api.discardOrderImport.mockResolvedValue(undefined)
  api.listOpenOrderImportDrafts.mockResolvedValue({
    drafts: [],
    permissions: { canEdit: true },
  })
})

describe('ImportModal leaving a batch', () => {
  it('discards a draft when the modal is closed', async () => {
    await openBatch('draft')
    fireEvent.click(closeButton())

    expect(url.close).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(api.discardOrderImport).toHaveBeenCalledWith(BATCH)
    )
  })

  it('discards the draft before choosing another file', async () => {
    const changeFile = await openBatch('draft')
    fireEvent.click(changeFile)

    expect(url.open).toHaveBeenCalledWith({ kind: 'new' })
    await waitFor(() =>
      expect(api.discardOrderImport).toHaveBeenCalledWith(BATCH)
    )
  })

  it.each([
    'committing',
    'awaiting_start',
    'releasing',
    'paused',
    'completed',
  ] as const)('only closes a %s import', async (status) => {
    await openBatch(status)
    fireEvent.click(closeButton())

    expect(url.close).toHaveBeenCalledTimes(1)
    expect(api.discardOrderImport).not.toHaveBeenCalled()
  })

  it("leaves a viewer's view of a draft alone", async () => {
    await openBatch('draft', false)
    fireEvent.click(closeButton())

    expect(url.close).toHaveBeenCalledTimes(1)
    expect(api.discardOrderImport).not.toHaveBeenCalled()
  })

  it('has nothing to discard on the upload step', async () => {
    renderModal({ kind: 'new' })
    await screen.findByText('upload step')
    fireEvent.click(closeButton())

    expect(url.close).toHaveBeenCalledTimes(1)
    expect(api.discardOrderImport).not.toHaveBeenCalled()
  })
})
