'use client'

import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'

export type SourceCredentialStatus =
  | 'ok'
  | 'store_inactive'
  | 'rejected'
  | 'removed'

export const SOURCE_OUTCOME_ACTIONS = [
  'customer_confirmation',
  'customer_cancellation',
  'merchant_no_reply_cancellation',
  'merchant_cancellation_tagging',
  'automatic_no_reply_tagging',
] as const

export type SourceOutcomeAction = (typeof SOURCE_OUTCOME_ACTIONS)[number]

/**
 * A source's health as separate facts. There is no overall status: each
 * signal has its own cause, and a store with no events is not a broken one.
 */
export interface SourceHealth {
  integrationId: string
  platformType: string
  connectionState: 'connected' | 'disconnected'
  disconnectedAt: string | null
  /** How far back the counts look. */
  windowDays: number
  /** The provider's last answer to Akeed's key; null when there is no key. */
  credentials: { status: SourceCredentialStatus } | null
  /** `lastAcceptedAt` null means no event yet. It is never a fault. */
  events: { lastAcceptedAt: string | null; acceptedCount: number }
  processing: { failedCount: number; lastFailedAt: string | null }
  backlog: { waitingCount: number; oldestWaitingAt: string | null }
  remoteSync: {
    failedCount: number
    lastFailedAt: string | null
    pendingCount: number
    requiresAssistance: boolean
  }
  delivery: {
    secretsMissing: boolean
    rejectedCount: number
    lastRejectedAt: string | null
  } | null
  capabilities: { action: SourceOutcomeAction; supported: boolean }[]
}

export function sourceHealthOptions() {
  return queryOptions({
    queryKey: queryKeys.settings.sourceHealth(),
    queryFn: () =>
      api.get<SourceHealth>('/api/settings/source-health', {
        cache: 'no-store',
      }),
  })
}
