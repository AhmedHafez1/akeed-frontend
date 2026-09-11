'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import type { CancelOrderResponse } from '@/shared/types/commerce-outcome.model'
import { retryManualOrderVerification } from '@/features/orders/api/manualOrderApi'

export interface SendTestVerificationResponse {
  success: boolean
  skipped?: boolean
  reason?: string
}

/*
 * Row actions own only the request and the event it causes. Which screens
 * repaint afterwards is decided once, in `shared/query/domainEvents`. The
 * events are emitted without being returned so a caller's success feedback
 * does not wait for every affected query to finish refetching.
 */

export function useCancelVerificationMutation() {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation({
    mutationFn: (verificationId: string) =>
      api.post<CancelOrderResponse>(
        `/api/verifications/${verificationId}/cancel`
      ),
    onSuccess: () => {
      void emitDomainEvent('verification.canceled')
    },
  })
}

export function useRetryVerificationMutation() {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation({
    // Retry is addressed to the order, not the verification: the backend
    // reopens the failed verification rather than creating a second one.
    mutationFn: (orderId: string) => retryManualOrderVerification(orderId),
    onSuccess: () => {
      void emitDomainEvent('verification.retried')
    },
  })
}

export function useSendTestVerificationMutation() {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation({
    mutationFn: (customerPhone: string) =>
      api.post<SendTestVerificationResponse>('/api/verifications/test', {
        customerPhone,
      }),
    // A skipped test still answers 2xx and may have changed usage state.
    onSuccess: () => {
      void emitDomainEvent('verification.testSent')
    },
  })
}
