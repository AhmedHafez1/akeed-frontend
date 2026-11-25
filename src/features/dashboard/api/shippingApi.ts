'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { ApiError } from '@/shared/lib/http'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'

export interface ShippingResolveResponse {
  resolvedAt: string
}

/** POST /api/verifications/:id/shipping/resolve. */
export function resolveShipping(verificationId: string) {
  return api.post<ShippingResolveResponse>(
    `/api/verifications/${encodeURIComponent(verificationId)}/shipping/resolve`,
    {}
  )
}

/**
 * What a failed "Mark done" tells the merchant, as a key under
 * `dashboard.shipping.resolveErrors`. Nothing open means someone already did
 * it: the refreshed list shows that, so it is not an error.
 */
export function shippingResolveErrorKey(
  error: unknown
): 'readOnly' | 'notFound' | 'generic' | null {
  if (!(error instanceof ApiError)) return 'generic'
  if (error.code === 'SHIPPING_NOTHING_TO_RESOLVE') return null
  if (error.code === 'SHIPPING_NOTIFICATION_NOT_FOUND') return 'notFound'
  if (error.status === 403) return 'readOnly'
  return 'generic'
}

/** Marks a delivery request or an unreached customer done; lists refresh either way. */
export function useResolveShipping() {
  const emitDomainEvent = useEmitDomainEvent()
  return useMutation({
    mutationFn: (verificationId: string) => resolveShipping(verificationId),
    onSettled: () => {
      void emitDomainEvent('verification.shippingResolved')
    },
  })
}
