'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import {
  useCommitOrderImport,
  useStartOrderImport,
} from '../api/orderImportMutations'
import { orderImportStartQuoteOptions } from '../api/orderImportQueries'
import {
  isOrderImportApiError,
  type OrderImportBatchDetail,
  type OrderImportStartQuote,
} from '../api/orderImportsApi'
import { flowFromBatch, flowReducer, initialFlow } from './importFlow'

export type SendNotice = 'stale' | 'startFailed' | 'importFailed' | null

/** How the step ended: the modal closes and says so. */
export type SendOutcome = { kind: 'sent' | 'imported'; count: number }

type PendingStart = { quoteToken: string }

/**
 * Step 3 (الإرسال): the quote and the two endings --
 * "استيراد فقط" (commit) and "استيراد وإرسال" (commit, then start as soon as
 * the orders are held). A draft is priced before its import; that quote's
 * token carries over to the start, and if the import changed N the server
 * answers with a fresh quote, which the merchant confirms again.
 */
export function useSendStep(
  detail: OrderImportBatchDetail,
  onDone: (outcome: SendOutcome) => void
) {
  const batchId = detail.batchId
  const queryClient = useQueryClient()
  const [flow, dispatch] = useReducer(flowReducer, undefined, () =>
    flowFromBatch(detail, true)
  )
  const imported = detail.status === 'awaiting_start'
  const quoteable =
    flow.phase === 'review' &&
    (imported || (detail.status === 'draft' && detail.mappingConfirmed))
  const quote = useQuery({
    ...orderImportStartQuoteOptions(batchId),
    enabled: quoteable,
  })
  const commit = useCommitOrderImport(batchId)
  const start = useStartOrderImport(batchId)
  const [notice, setNotice] = useState<SendNotice>(null)
  // Set when the merchant pressed "استيراد وإرسال"; null for "import only"
  // and for an import this tab did not start (a refresh mid-commit).
  const pendingStart = useRef<PendingStart | null>(null)
  const importedHere = useRef(false)
  const done = useRef(onDone)
  done.current = onDone

  const current = quote.data
  const ready = detail.counts.ready ?? 0
  const sendBlocked =
    !current || current.blockers.length > 0 || current.orders === 0
  const canSend = !sendBlocked && flow.phase === 'review' && !quote.isFetching
  const canImportOnly =
    detail.status === 'draft' && flow.phase === 'review' && ready > 0

  const backToReview = () =>
    dispatch({ type: 'restore', state: { ...initialFlow, phase: 'review' } })

  const startSending = (pending: PendingStart) => {
    start.mutate(pending, {
      onSuccess: (batch) =>
        done.current({
          kind: 'sent',
          count: batch.counts.imported ?? batch.release?.total ?? ready,
        }),
      onError: (error) => {
        backToReview()
        if (
          isOrderImportApiError(error) &&
          error.code === 'IMPORT_QUOTE_STALE' &&
          error.quote
        ) {
          queryClient.setQueryData<OrderImportStartQuote>(
            queryKeys.orderImports.startQuote(batchId),
            error.quote
          )
          setNotice('stale')
          return
        }
        if (isOrderImportApiError(error) && error.blockers?.length) {
          queryClient.setQueryData<OrderImportStartQuote>(
            queryKeys.orderImports.startQuote(batchId),
            (old) => (old ? { ...old, blockers: error.blockers ?? [] } : old)
          )
          return
        }
        setNotice('startFailed')
      },
    })
  }

  /** "استيراد وإرسال" (send) or "استيراد فقط"; once imported, only send. */
  const submit = (send: boolean) => {
    if (send && (!canSend || !current)) return
    if (!send && !canImportOnly) return
    setNotice(null)
    const pending = send ? { quoteToken: current!.quoteToken } : null
    if (imported) {
      if (!pending) return
      dispatch({ type: 'sendStarted' })
      startSending(pending)
      return
    }
    pendingStart.current = pending
    importedHere.current = true
    dispatch({ type: 'import', send })
    commit.mutate(undefined, {
      onError: () => {
        pendingStart.current = null
        dispatch({ type: 'importFailed' })
        setNotice('importFailed')
      },
    })
  }

  // The commit runs in the background; the batch is polled until it is in.
  useEffect(() => {
    if (flow.phase !== 'importing' || detail.status !== 'awaiting_start') return
    if (!importedHere.current) {
      backToReview()
      return
    }
    const pending = pendingStart.current
    pendingStart.current = null
    dispatch({ type: 'imported' })
    if (pending) startSending(pending)
    else
      done.current({
        kind: 'imported',
        count: detail.counts.imported ?? ready,
      })
    // Runs once per arrival at awaiting_start while importing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.phase, detail.status])

  return {
    phase: flow.phase,
    /** The running import will also start sending. */
    sendAfterImport: flow.sendAfterImport,
    quote,
    imported,
    notice,
    canSend,
    sendBlocked,
    canImportOnly,
    submit,
  }
}
