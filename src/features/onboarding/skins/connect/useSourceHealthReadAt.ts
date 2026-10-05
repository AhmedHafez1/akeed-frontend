'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'

/**
 * When the source's health was last read in this session, or 0 when it has
 * not been. A health read may ask the store and change what Akeed holds about
 * the connection, so a connection panel on the same screen reads its status
 * again when this moves.
 *
 * It listens to the cache and never fetches: the health card owns the read.
 */
export function useSourceHealthReadAt(): number {
  const queryClient = useQueryClient()
  const subscribe = useCallback(
    (onChange: () => void) => queryClient.getQueryCache().subscribe(onChange),
    [queryClient]
  )
  const read = useCallback(
    () =>
      queryClient.getQueryState(queryKeys.settings.sourceHealth())
        ?.dataUpdatedAt ?? 0,
    [queryClient]
  )
  return useSyncExternalStore(subscribe, read, () => 0)
}
