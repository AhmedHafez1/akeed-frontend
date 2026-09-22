'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { useStartOrderImport } from '../api/orderImportMutations'
import { orderImportStartQuoteOptions } from '../api/orderImportQueries'
import {
  isOrderImportApiError,
  type OrderImportStartQuote,
} from '../api/orderImportsApi'

export type StartNotice = 'stale' | 'failed' | null

/**
 * State for the start dialog (M7): a fresh quote while it is open, the
 * attestation tick, and the start itself.
 *
 * A stale or refused start swaps in what the server answered with -- a new
 * quote, or the current blockers -- and asks the merchant to confirm again,
 * so they never start on numbers they did not see.
 */
export function useStartConfirmation(batchId: string, open: boolean) {
  const queryClient = useQueryClient()
  const quoteKey = queryKeys.orderImports.startQuote(batchId)
  const quote = useQuery({
    ...orderImportStartQuoteOptions(batchId),
    enabled: open,
  })
  const start = useStartOrderImport(batchId)
  const [agreed, setAgreed] = useState(false)
  const [notice, setNotice] = useState<StartNotice>(null)

  const current = quote.data
  const canStart =
    !!current &&
    current.blockers.length === 0 &&
    agreed &&
    !start.isPending &&
    !quote.isFetching

  function submit(onStarted: () => void) {
    if (!current || !canStart) return
    setNotice(null)
    start.mutate(
      {
        attestationVersion: current.attestation.version,
        quoteToken: current.quoteToken,
      },
      {
        onSuccess: onStarted,
        onError: (error) => {
          setAgreed(false)
          if (!isOrderImportApiError(error)) {
            setNotice('failed')
            return
          }
          if (error.code === 'IMPORT_QUOTE_STALE' && error.quote) {
            queryClient.setQueryData<OrderImportStartQuote>(
              quoteKey,
              error.quote
            )
            setNotice('stale')
            return
          }
          if (error.blockers?.length) {
            queryClient.setQueryData<OrderImportStartQuote>(quoteKey, (old) =>
              old ? { ...old, blockers: error.blockers ?? [] } : old
            )
            return
          }
          setNotice('failed')
        },
      }
    )
  }

  function reset() {
    setAgreed(false)
    setNotice(null)
    start.reset()
  }

  return {
    quote,
    agreed,
    setAgreed,
    notice,
    canStart,
    isStarting: start.isPending,
    submit,
    reset,
  }
}
