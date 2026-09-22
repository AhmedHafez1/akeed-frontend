'use client'

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { queryKeys } from '@/shared/query/keys'
import { countsAfterInclude } from '../domain/reviewSummary'
import {
  commitOrderImport,
  discardOrderImport,
  resumeOrderImport,
  startOrderImport,
  stopOrderImport,
  saveOrderImportMapping,
  setOrderImportRowInclude,
  uploadOrderImport,
  type OrderImportBatchDetail,
  type OrderImportMappingSaved,
  type OrderImportRow,
  type OrderImportRowOutcome,
  type OrderImportStopResult,
  type OrderImportRowsPage,
  type OrderImportRowUpdate,
  type OrderImportUploadResponse,
  type SaveOrderImportMappingBody,
} from './orderImportsApi'

export function useUploadOrderImport() {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<
    OrderImportUploadResponse,
    Error,
    {
      file: File
      signal?: AbortSignal
      onProgress?: (fraction: number) => void
    }
  >({
    mutationFn: ({ file, signal, onProgress }) =>
      uploadOrderImport(file, { signal, onProgress }),
    onSuccess: () => {
      void emitDomainEvent('orderImport.changed')
    },
  })
}

export function useSaveOrderImportMapping(batchId: string) {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<
    OrderImportMappingSaved,
    Error,
    SaveOrderImportMappingBody
  >({
    mutationFn: (body) => saveOrderImportMapping(batchId, body),
    // The detail is re-read so the page moves to review from the server's
    // own `mappingConfirmed`, and every row list is re-validated.
    onSuccess: () => emitDomainEvent('orderImport.changed'),
  })
}

export function useDiscardOrderImport() {
  const queryClient = useQueryClient()
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<void, Error, string>({
    mutationFn: (batchId) => discardOrderImport(batchId),
    onSuccess: (_result, batchId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.orderImports.detail(batchId),
      })
      void emitDomainEvent('orderImport.changed')
    },
  })
}

type RowsCache = InfiniteData<OrderImportRowsPage, string | null>

type IncludeContext = {
  rows: RowsCache | undefined
  detail: OrderImportBatchDetail | undefined
}

function replaceRow(
  cache: RowsCache | undefined,
  rowNumber: number,
  update: (row: OrderImportRow) => OrderImportRow
): RowsCache | undefined {
  if (!cache) return cache
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      rows: page.rows.map((row) =>
        row.rowNumber === rowNumber ? update(row) : row
      ),
    })),
  }
}

/**
 * Includes or excludes one possible duplicate (story AC7). The row and the
 * tiles change at once; an error puts both back. The row stays in the list
 * it was toggled in, so the merchant can undo it there.
 */
export function useSetOrderImportRowInclude(
  batchId: string,
  outcome: OrderImportRowOutcome
) {
  const queryClient = useQueryClient()
  const rowsKey = queryKeys.orderImports.rows(batchId, outcome)
  const detailKey = queryKeys.orderImports.detail(batchId)

  return useMutation<
    OrderImportRowUpdate,
    Error,
    { rowNumber: number; include: boolean },
    IncludeContext
  >({
    mutationFn: ({ rowNumber, include }) =>
      setOrderImportRowInclude(batchId, rowNumber, include),
    onMutate: async ({ rowNumber, include }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: rowsKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
      ])
      const context: IncludeContext = {
        rows: queryClient.getQueryData<RowsCache>(rowsKey),
        detail: queryClient.getQueryData<OrderImportBatchDetail>(detailKey),
      }
      queryClient.setQueryData<RowsCache>(rowsKey, (cache) =>
        replaceRow(cache, rowNumber, (row) => ({
          ...row,
          includeOverride: include,
          outcome: include ? 'ready' : 'excluded',
        }))
      )
      if (context.detail)
        queryClient.setQueryData<OrderImportBatchDetail>(detailKey, {
          ...context.detail,
          counts: countsAfterInclude(context.detail.counts, include),
        })
      return context
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(rowsKey, context?.rows)
      queryClient.setQueryData(detailKey, context?.detail)
    },
    onSuccess: ({ row, counts }) => {
      queryClient.setQueryData<RowsCache>(rowsKey, (cache) =>
        replaceRow(cache, row.rowNumber, () => row)
      )
      queryClient.setQueryData<OrderImportBatchDetail>(detailKey, (detail) =>
        detail ? { ...detail, counts } : detail
      )
      // The other tabs gained or lost this row; the open one keeps it.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orderImports.all,
        predicate: (query) =>
          query.queryKey[1] === 'rows' &&
          query.queryKey[2] === batchId &&
          query.queryKey[3] !== outcome,
      })
    },
  })
}

/**
 * Start the import.
 *
 * The 202 carries the batch as it now stands, so writing it into the detail
 * cache moves the page to the committing view and starts its poll without
 * waiting for a refetch.
 */
export function useCommitOrderImport(batchId: string) {
  const queryClient = useQueryClient()
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<OrderImportBatchDetail, Error, void>({
    mutationFn: () => commitOrderImport(batchId),
    onSuccess: (batch) => {
      queryClient.setQueryData(queryKeys.orderImports.detail(batchId), batch)
      void emitDomainEvent('orderImport.changed')
    },
    onError: () => {
      // A refusal means the server knows something this page does not --
      // another tab committed it, or the draft lapsed. Re-read rather than
      // guessing which.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orderImports.detail(batchId),
      })
    },
  })
}

/**
 * Start sending the batch's held orders. The 202 carries the releasing batch,
 * so the page moves to the release panel without waiting for a refetch.
 */
export function useStartOrderImport(batchId: string) {
  const queryClient = useQueryClient()
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<
    OrderImportBatchDetail,
    Error,
    { attestationVersion: string; quoteToken: string }
  >({
    mutationFn: (body) => startOrderImport(batchId, body),
    onSuccess: (batch) => {
      queryClient.setQueryData(queryKeys.orderImports.detail(batchId), batch)
      void emitDomainEvent('orderImport.started')
    },
  })
}

/** Continue a paused batch; the start's attestation still covers it. */
export function useResumeOrderImport(batchId: string) {
  const queryClient = useQueryClient()
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<OrderImportBatchDetail, Error, void>({
    mutationFn: () => resumeOrderImport(batchId),
    onSuccess: (batch) => {
      queryClient.setQueryData(queryKeys.orderImports.detail(batchId), batch)
      void emitDomainEvent('orderImport.started')
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orderImports.detail(batchId),
      })
    },
  })
}

/** Withdraw every order not yet sent. Safe to repeat. */
export function useStopOrderImport(batchId: string) {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation<OrderImportStopResult, Error, void>({
    mutationFn: () => stopOrderImport(batchId),
    onSettled: () => {
      void emitDomainEvent('orderImport.stopped')
    },
  })
}
