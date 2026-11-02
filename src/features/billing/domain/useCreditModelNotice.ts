'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import {
  dismissCreditModelNotice,
  type CreditModelNotice,
} from '../api/billingApi'
import { creditModelNoticeOptions } from '../api/billingQueries'

/**
 * The one-time notice that a balance number doubled at the same value. It is
 * a courtesy, so a failed read shows nothing rather than an error.
 */
export function useCreditModelNotice() {
  const client = useQueryClient()
  const { data } = useQuery(creditModelNoticeOptions())
  const dismiss = useMutation({
    mutationFn: dismissCreditModelNotice,
    onSuccess: () =>
      client.setQueryData<CreditModelNotice>(
        queryKeys.billing.creditModelNotice(),
        (notice) => (notice ? { ...notice, visible: false } : notice)
      ),
  })

  return {
    isVisible: data?.visible ?? false,
    canDismiss: data?.canDismiss ?? false,
    dismiss: dismiss.mutate,
    isDismissing: dismiss.isPending,
  }
}
