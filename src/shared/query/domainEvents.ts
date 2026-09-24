'use client'

import { useCallback } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { queryKeys } from './keys'

/**
 * Things that happen to a merchant's data, named by what happened rather than
 * by which screen should repaint.
 */
export type DomainEvent =
  /** The backend accepted a manual order (202). Its verification may not exist yet. */
  | 'order.created'
  /** An accepted order's verification now exists, so its credit is held. */
  | 'order.materialized'
  /**
   * That verification left `pending`: WhatsApp accepted the send (the held
   * credit is posted) or refused it (the hold is released).
   */
  | 'order.dispatched'
  /** An accepted order was never seen to materialize within the reconcile window. */
  | 'order.reconcileExpired'
  | 'verification.canceled'
  /** The merchant confirmed an order by hand from the dashboard. */
  | 'verification.confirmed'
  | 'verification.retried'
  | 'verification.testSent'
  | 'credits.purchased'
  /** A file import was uploaded, re-mapped, changed or discarded. Nothing was sent. */
  | 'orderImport.changed'
  /**
   * An import finished creating its held orders. Unlike a manual order, those
   * orders are listable the moment they exist -- held, not waiting on a
   * worker -- so the lists can be refreshed straight away.
   */
  | 'orderImport.committed'
  /**
   * The merchant started (or resumed) sending an import's held orders. They
   * now move through the shared verification lifecycle and spend credits.
   */
  | 'orderImport.started'
  /** The merchant stopped an import; its unsent orders are now not started. */
  | 'orderImport.stopped'

/**
 * The only place that knows the cross-screen consequences of a change.
 *
 * A mutation emits the event; it never names the dashboard, the sidebar or the
 * billing page. Invalidation refetches mounted queries immediately and marks
 * unmounted ones stale, so a screen opened later reads fresh data too.
 */
const AFFECTED_QUERIES: Record<DomainEvent, ReadonlyArray<QueryKey>> = {
  // Lists and stats are left alone on acceptance: a worker creates the
  // verification after the 202, so a refetch now would come back without it.
  // The optimistic row stands in until `order.materialized` refreshes them.
  'order.created': [
    queryKeys.verifications.pageContext(),
    queryKeys.billing.summary(),
  ],
  'order.materialized': [queryKeys.verifications.all, queryKeys.billing.all],
  'order.dispatched': [queryKeys.verifications.all, queryKeys.billing.all],
  'order.reconcileExpired': [
    queryKeys.verifications.all,
    queryKeys.billing.all,
  ],
  'verification.canceled': [queryKeys.verifications.all],
  'verification.confirmed': [queryKeys.verifications.all],
  'verification.retried': [
    queryKeys.verifications.all,
    queryKeys.billing.summary(),
  ],
  'verification.testSent': [
    queryKeys.verifications.all,
    queryKeys.billing.summary(),
  ],
  // An import's start quote reads the balance, so it re-quotes too.
  'credits.purchased': [
    queryKeys.billing.all,
    queryKeys.verifications.pageContext(),
    queryKeys.orderImports.all,
  ],
  'orderImport.changed': [queryKeys.orderImports.all],
  'orderImport.committed': [
    queryKeys.orderImports.all,
    queryKeys.verifications.all,
    queryKeys.billing.all,
  ],
  'orderImport.started': [
    queryKeys.orderImports.all,
    queryKeys.verifications.all,
    queryKeys.billing.all,
  ],
  'orderImport.stopped': [
    queryKeys.orderImports.all,
    queryKeys.verifications.all,
    queryKeys.billing.all,
  ],
}

export function useEmitDomainEvent() {
  const queryClient = useQueryClient()

  return useCallback(
    (event: DomainEvent) =>
      Promise.all(
        AFFECTED_QUERIES[event].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      ).then(() => undefined),
    [queryClient]
  )
}
