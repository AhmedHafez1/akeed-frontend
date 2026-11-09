'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import type { CommerceOutcomeOperationResult } from '@/shared/types/commerce-outcome.model'

/** The request a page showed, so a stale page is refused, not applied. */
export interface ChangeRequestTarget {
  verificationId: string
  changeRequestId: string
  confirmationCycle: number
}

export interface ChangeRequestResolutionResponse {
  success: true
  verificationId: string
  status: 'confirmed' | 'canceled'
  changeRequestId: string
  operation?: CommerceOutcomeOperationResult
}

export interface ChangeRequestDetailResponse {
  change_request: {
    id: string
    status: 'open' | 'resolved'
    resolution:
      | 'customer_confirmed'
      | 'customer_canceled'
      | 'merchant_confirmed'
      | 'merchant_canceled'
      | 'reconfirmation_sent'
      | null
  } | null
}

const base = (verificationId: string) =>
  `/api/verifications/${encodeURIComponent(verificationId)}/change-request`

/** The request's current state, read after a refused (stale) action. */
export function fetchChangeRequest(verificationId: string) {
  return api.get<ChangeRequestDetailResponse>(base(verificationId))
}

/**
 * The merchant's three outcomes. Each refreshes the lists whatever the
 * answer: a refusal usually means the customer answered first.
 */
export function useChangeRequestMutations() {
  const emitDomainEvent = useEmitDomainEvent()
  const settle = () => {
    void emitDomainEvent('verification.changeRequestChanged')
  }
  const confirm = useMutation({
    mutationFn: (target: ChangeRequestTarget) =>
      api.post<ChangeRequestResolutionResponse>(
        `${base(target.verificationId)}/confirm`,
        { changeRequestId: target.changeRequestId }
      ),
    onSettled: settle,
  })
  const cancel = useMutation({
    mutationFn: (target: ChangeRequestTarget) =>
      api.post<ChangeRequestResolutionResponse>(
        `${base(target.verificationId)}/cancel`,
        { changeRequestId: target.changeRequestId }
      ),
    onSettled: settle,
  })
  const resend = useMutation({
    mutationFn: (target: ChangeRequestTarget) =>
      api.post<{ reconfirmation: unknown }>(
        `${base(target.verificationId)}/resend`,
        {
          changeRequestId: target.changeRequestId,
          expectedCycle: target.confirmationCycle,
        }
      ),
    onSettled: settle,
  })
  return { confirm, cancel, resend }
}
