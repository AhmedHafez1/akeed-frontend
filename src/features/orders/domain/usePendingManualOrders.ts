'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { mutationKeys, queryKeys } from '@/shared/query/keys'
import type { CreateManualOrderVariables } from '../api/useCreateManualOrderMutation'
import type { ManualOrderCreateResponse } from '../api/manualOrderApi'
import {
  hasUnobservedSteps,
  nextExpiryAt,
  selectAcceptedOrderIds,
  selectExpiredOrderIds,
  selectPendingManualOrders,
  type ManualOrderSubmission,
  type OrderTracking,
} from './pendingManualOrders'

const RECONCILE_POLL_MS = 2_000
/** Newest-first window searched for a just-created verification. */
const RECENT_VERIFICATIONS_LIMIT = 25

const NOTHING_TRACKED: OrderTracking = {}

interface RecentVerificationsResponse {
  data: Array<{ order_id: string; status: string }>
}

/**
 * One newest-first read of the merchant's verifications, folded into what is
 * known about each accepted order, plus the event the first new step implies.
 */
async function observeOrders(
  acceptedOrderIds: ReadonlyArray<string>,
  previous: OrderTracking,
  signal: AbortSignal
): Promise<{
  tracking: OrderTracking
  event: 'order.materialized' | 'order.dispatched' | null
}> {
  const recent = await api.get<RecentVerificationsResponse>(
    `/api/verifications?date_range=today&limit=${RECENT_VERIFICATIONS_LIMIT}`,
    { signal }
  )
  const statusByOrder = new Map(
    recent.data.map((row) => [row.order_id, row.status])
  )
  const observedAt = Date.now()
  const tracking: Record<string, { seenAt: number; dispatchedAt?: number }> = {
    ...previous,
  }
  let materialized = false
  let dispatched = false

  for (const orderId of acceptedOrderIds) {
    const status = statusByOrder.get(orderId)
    if (status === undefined) continue
    const leftPending = status !== 'pending'
    const current = tracking[orderId]
    if (!current) {
      tracking[orderId] = leftPending
        ? { seenAt: observedAt, dispatchedAt: observedAt }
        : { seenAt: observedAt }
      materialized = true
    } else if (current.dispatchedAt === undefined && leftPending) {
      tracking[orderId] = { ...current, dispatchedAt: observedAt }
      dispatched = true
    }
  }

  // Both events refresh the same queries; one invalidation per read suffices.
  const event = materialized
    ? 'order.materialized'
    : dispatched
      ? 'order.dispatched'
      : null
  return { tracking, event }
}

/**
 * Manual orders the merchant created, read straight from the mutation cache,
 * with what has been observed of them on the server.
 *
 * An accepted order goes through two server steps the UI cannot see happen:
 * a worker creates its verification (holding a credit), then WhatsApp accepts
 * or refuses the message (posting or releasing that credit). A newest-first
 * read of the merchant's verifications detects each step, and each detection
 * invalidates the affected queries.
 *
 * Every caller reads the same cached observations. Only the one mounted with
 * `reconcile` polls for them; the others would just multiply the requests.
 */
export function usePendingManualOrders({
  reconcile = false,
}: { reconcile?: boolean } = {}) {
  const queryClient = useQueryClient()
  const emitDomainEvent = useEmitDomainEvent()
  const [now, setNow] = useState(() => Date.now())

  const submissions = useMutationState<ManualOrderSubmission>({
    filters: { mutationKey: mutationKeys.createManualOrder },
    select: (mutation) => {
      const variables = mutation.state.variables as
        | CreateManualOrderVariables
        | undefined
      return {
        status: mutation.state.status,
        idempotencyKey: variables?.idempotencyKey,
        payload: variables?.payload,
        response: mutation.state.data as ManualOrderCreateResponse | undefined,
        submittedAt: mutation.state.submittedAt,
      }
    },
  })

  // A submission made after the last tick must be measured against its own
  // start, not a clock reading from before it existed.
  const effectiveNow = submissions.reduce(
    (latest, submission) => Math.max(latest, submission.submittedAt),
    now
  )

  const trackingKey = queryKeys.orders.tracking()
  const acceptedOrderIds = selectAcceptedOrderIds(submissions, effectiveNow)
  const cachedTracking =
    queryClient.getQueryData<OrderTracking>(trackingKey) ?? NOTHING_TRACKED

  const { data: tracking = NOTHING_TRACKED } = useQuery({
    queryKey: trackingKey,
    queryFn: async ({ signal }) => {
      const previous =
        queryClient.getQueryData<OrderTracking>(trackingKey) ?? NOTHING_TRACKED
      if (!hasUnobservedSteps(acceptedOrderIds, previous)) return previous
      const observation = await observeOrders(
        acceptedOrderIds,
        previous,
        signal
      )
      // Not awaited: views compare their own fetch time against `seenAt`, so
      // each drops its optimistic share in the render its fresh data arrives.
      if (observation.event) void emitDomainEvent(observation.event)
      return observation.tracking
    },
    enabled: hasUnobservedSteps(acceptedOrderIds, cachedTracking),
    refetchInterval: reconcile ? RECONCILE_POLL_MS : false,
    // Polling pauses while the tab is hidden. On return the list and totals
    // re-read at once, so the observation must too, or they would briefly
    // count an order the UI still believes unseen.
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  })

  // Re-render when the next submission leaves the window, so an order the
  // worker never materialized stops rendering on schedule.
  const expiryAt = nextExpiryAt(submissions, effectiveNow)
  useEffect(() => {
    if (expiryAt === null) return
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, expiryAt - Date.now()) + 1
    )
    return () => window.clearTimeout(timer)
  }, [expiryAt])

  const pendingOrders = useMemo(
    () => selectPendingManualOrders(submissions, tracking, effectiveNow),
    [effectiveNow, submissions, tracking]
  )
  const expiredOrderIds = useMemo(
    () => selectExpiredOrderIds(submissions, tracking, effectiveNow),
    [effectiveNow, submissions, tracking]
  )

  return { pendingOrders, expiredOrderIds }
}
