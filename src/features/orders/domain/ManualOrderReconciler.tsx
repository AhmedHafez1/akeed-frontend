'use client'

import { useEffect, useRef } from 'react'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { usePendingManualOrders } from './usePendingManualOrders'

/**
 * Follows accepted manual orders until their verification exists.
 *
 * Mounted once in the standalone shell rather than in any one screen, so an
 * order created and then left behind — the merchant moved on to Billing —
 * still settles, and still refreshes the credits it spent. Renders nothing.
 */
export function ManualOrderReconciler() {
  const { expiredOrderIds } = usePendingManualOrders({ reconcile: true })
  const emitDomainEvent = useEmitDomainEvent()
  const announced = useRef(new Set<string>())

  useEffect(() => {
    const unannounced = expiredOrderIds.filter(
      (orderId) => !announced.current.has(orderId)
    )
    if (unannounced.length === 0) return
    unannounced.forEach((orderId) => announced.current.add(orderId))
    void emitDomainEvent('order.reconcileExpired')
  }, [emitDomainEvent, expiredOrderIds])

  return null
}
