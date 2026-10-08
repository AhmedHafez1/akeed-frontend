'use client'

import { useCallback, useState } from 'react'
import { createLogger } from '@/shared/lib/logger'
import { useRetryOutcomeSyncMutation } from '../api/verificationMutations'

const logger = createLogger('OutcomeSyncRetry')

/**
 * How one retry of a store update ended. `updated` and `pending` both mean the
 * request was taken; `failed` means the store refused again, and `error` that
 * the request itself did not go through.
 */
export type OutcomeSyncRetryResult = 'updated' | 'pending' | 'failed' | 'error'

/**
 * Asks the server to tell the store again about a result it failed to take.
 * The verification's own result is never changed by this.
 */
export function useOutcomeSyncRetry() {
  const { mutateAsync } = useRetryOutcomeSyncMutation()
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const retry = useCallback(
    async (verificationId: string): Promise<OutcomeSyncRetryResult> => {
      setRetryingId(verificationId)
      try {
        const { remote_sync: sync } = await mutateAsync(verificationId)
        if (sync?.state === 'succeeded') return 'updated'
        return sync?.state === 'pending' ? 'pending' : 'failed'
      } catch (error) {
        logger.warn('Failed to retry the store update', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        return 'error'
      } finally {
        setRetryingId(null)
      }
    },
    [mutateAsync]
  )

  return { retryingId, retry }
}
