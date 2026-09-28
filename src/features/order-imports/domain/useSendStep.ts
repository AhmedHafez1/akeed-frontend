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
export type SendOutcome = { kind: 'sent'; count: number }

type PendingStart = { quoteToken: string }

/**
 * Step 3 (الإرسال): review the quote, then commit and start. A draft is
 * priced before import; its quote token carries over to start, and if the
 * import changed N the server returns a fresh quote for confirmation.
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
  // A refresh mid-commit has no token, so it must not start automatically.
  const pendingStart = useRef<PendingStart | null>(null)
  const done = useRef(onDone)
  done.current = onDone

  const current = quote.data
  const ready = detail.counts.ready ?? 0
  const sendBlocked =
    !current || current.blockers.length > 0 || current.orders === 0
  const canSend = !sendBlocked && flow.phase === 'review' && !quote.isFetching

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

  const submit = () => {
    if (!canSend || !current) return
    setNotice(null)
    const pending = { quoteToken: current.quoteToken }
    if (imported) {
      dispatch({ type: 'sendStarted' })
      startSending(pending)
      return
    }
    pendingStart.current = pending
    dispatch({ type: 'import' })
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
    const pending = pendingStart.current
    pendingStart.current = null
    if (!pending) {
      backToReview()
      return
    }
    dispatch({ type: 'imported' })
    startSending(pending)
    // Runs once per arrival at awaiting_start while importing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.phase, detail.status])

  return {
    phase: flow.phase,
    quote,
    imported,
    notice,
    canSend,
    sendBlocked,
    submit,
  }
}
