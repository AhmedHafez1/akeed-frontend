'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  IMPORT_START_PARAM,
  readImportTarget,
  withImportTarget,
  type ImportModalTarget,
} from './importRoutes'

/**
 * The import modal's state lives in the URL (`?import=new|<batchId>`), so a
 * refresh reopens the same step and browser Back leaves it. Opening and moving
 * to a batch push a history entry; closing replaces it.
 */
export function useImportModalUrl() {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const query = searchParams.toString()

  const target = useMemo(
    () => readImportTarget(new URLSearchParams(query)),
    [query]
  )
  const reopenStart = new URLSearchParams(query).get(IMPORT_START_PARAM) === '1'

  const open = useCallback(
    (next: ImportModalTarget) =>
      router.push(`${pathname}${withImportTarget(query, next)}`, {
        scroll: false,
      }),
    [router, pathname, query]
  )

  const close = useCallback(
    () =>
      router.replace(`${pathname}${withImportTarget(query, null)}`, {
        scroll: false,
      }),
    [router, pathname, query]
  )

  /** Buy credits' return trip is over: keep the batch, drop `start`. */
  const clearStart = useCallback(() => {
    const current = readImportTarget(new URLSearchParams(query))
    if (current)
      router.replace(`${pathname}${withImportTarget(query, current)}`, {
        scroll: false,
      })
  }, [router, pathname, query])

  return { target, reopenStart, open, close, clearStart }
}
