'use client'

import { useMutation } from '@tanstack/react-query'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { mutationKeys } from '@/shared/query/keys'
import {
  createManualOrder,
  type ManualOrderCreateInput,
  type ManualOrderCreateResponse,
} from './manualOrderApi'

export type CreateManualOrderVariables = {
  payload: ManualOrderCreateInput
  idempotencyKey: string
  signal?: AbortSignal
}

/**
 * Submits a manual order under a shared mutation key.
 *
 * The key is what lets the dashboard render the order before the server has
 * answered: it reads in-flight and just-accepted submissions back out of the
 * mutation cache, with no reference to the dialog that started them.
 */
export function useCreateManualOrderMutation() {
  const emitDomainEvent = useEmitDomainEvent()

  return useMutation<
    ManualOrderCreateResponse,
    Error,
    CreateManualOrderVariables
  >({
    mutationKey: mutationKeys.createManualOrder,
    mutationFn: ({ payload, idempotencyKey, signal }) =>
      createManualOrder(payload, idempotencyKey, signal),
    // Not returned: an awaited invalidation would hold the dialog's success
    // state until every affected screen had finished refetching.
    onSuccess: () => {
      void emitDomainEvent('order.created')
    },
  })
}
