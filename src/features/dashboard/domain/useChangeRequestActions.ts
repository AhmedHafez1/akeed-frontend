'use client'

import { useRef, useState } from 'react'
import { ApiError } from '@/shared/lib/http'
import {
  fetchChangeRequest,
  useChangeRequestMutations,
  type ChangeRequestTarget,
} from '../api/changeRequestApi'

export type ChangeRequestAction = 'confirm' | 'cancel' | 'resend'

/** What settled the request first, when the merchant's action was too late. */
export type ChangeRequestStaleOutcome = 'confirmed' | 'canceled' | 'resent'

export type ChangeRequestActionResult =
  | { status: 'success'; action: ChangeRequestAction }
  | { status: 'stale'; outcome: ChangeRequestStaleOutcome | null }
  | { status: 'error'; action: ChangeRequestAction; code?: string }

/** Refusals that mean the page is behind: refresh, never retry blindly. */
const STALE_CODES = new Set([
  'CHANGE_REQUEST_ALREADY_RESOLVED',
  'CHANGE_REQUEST_NOT_OPEN',
  'CHANGE_REQUEST_STALE',
  'CHANGE_REQUEST_NOT_ACTIONABLE',
])

function staleOutcomeOf(
  resolution: string | null | undefined
): ChangeRequestStaleOutcome | null {
  if (
    resolution === 'customer_confirmed' ||
    resolution === 'merchant_confirmed'
  )
    return 'confirmed'
  if (resolution === 'customer_canceled' || resolution === 'merchant_canceled')
    return 'canceled'
  if (resolution === 'reconfirmation_sent') return 'resent'
  return null
}

/**
 * The merchant's outcomes for one change request, shared by both skins. One
 * action at a time: a second click while one is in flight does nothing, and
 * the server joins a repeated resend to the one already queued. A refusal
 * because the customer (or another tab) settled the request first comes back
 * as `stale` with what won, after the lists were refreshed.
 */
export function useChangeRequestActions() {
  const { confirm, cancel, resend } = useChangeRequestMutations()
  const [pending, setPending] = useState<ChangeRequestAction | null>(null)
  const inFlight = useRef(false)

  const run = async (
    action: ChangeRequestAction,
    target: ChangeRequestTarget
  ): Promise<ChangeRequestActionResult | null> => {
    if (inFlight.current) return null
    inFlight.current = true
    setPending(action)
    try {
      const mutation =
        action === 'confirm' ? confirm : action === 'cancel' ? cancel : resend
      await mutation.mutateAsync(target)
      return { status: 'success', action }
    } catch (error) {
      const code = error instanceof ApiError ? error.code : undefined
      if (code && STALE_CODES.has(code)) {
        const latest = await fetchChangeRequest(target.verificationId).catch(
          () => null
        )
        const request = latest?.change_request
        return {
          status: 'stale',
          outcome:
            request && request.id === target.changeRequestId
              ? staleOutcomeOf(request.resolution)
              : null,
        }
      }
      return { status: 'error', action, code }
    } finally {
      inFlight.current = false
      setPending(null)
    }
  }

  return { pending, run }
}
