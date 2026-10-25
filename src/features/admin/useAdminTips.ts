'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminApiError } from './adminApi'
import { getTipCampaign, getTipCampaigns, getTipOptions } from './adminTipsApi'
import type {
  AdminTipOrganization,
  AdminTipOrganizationsResponse,
  TipStatus,
} from './admin-tips.model'
import { toTemplateError, useResource } from './useAdminTemplateDrafts'

export function useTipCampaigns(params: {
  status?: TipStatus
  search?: string
  cursor?: string
}) {
  const key = JSON.stringify(params)
  // The serialized key is the dependency; `params` is a new object per render.
  const load = useCallback(
    () => getTipCampaigns(JSON.parse(key) as typeof params),
    [key]
  )
  return useResource('Tips campaigns request failed', key, load)
}

export function useTipCampaign(id: string) {
  const load = useCallback(() => getTipCampaign(id), [id])
  return useResource('Tips campaign request failed', id, load)
}

export function useTipOptions() {
  return useResource('Tips options request failed', 'options', getTipOptions)
}

const SEARCH_DELAY_MS = 300

interface OrganizationPages {
  key: string
  items: AdminTipOrganization[]
  cursor: string | null
  error: AdminApiError | null
}

/**
 * A searchable organization list with "load more". The search waits for the
 * admin to stop typing; `reloadKey` refetches from the start (after a save).
 */
export function useOrganizationPages(
  load: (params: {
    search?: string
    cursor?: string
  }) => Promise<AdminTipOrganizationsResponse>,
  options: { enabled?: boolean; reloadKey?: string | number } = {}
) {
  const enabled = options.enabled ?? true
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [pages, setPages] = useState<OrganizationPages | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const requestKey = enabled ? `${term}#${options.reloadKey ?? ''}` : null

  useEffect(() => {
    const timer = window.setTimeout(
      () => setTerm(search.trim()),
      SEARCH_DELAY_MS
    )
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (requestKey === null) return
    let current = true
    load({ search: term || undefined })
      .then((page) => {
        if (current)
          setPages({
            key: requestKey,
            items: page.items,
            cursor: page.next_cursor,
            error: null,
          })
      })
      .catch((cause: unknown) => {
        if (current)
          setPages({
            key: requestKey,
            items: [],
            cursor: null,
            error: toTemplateError('Organizations request failed', cause),
          })
      })
    return () => {
      current = false
    }
  }, [load, requestKey, term])

  const current = pages && pages.key === requestKey ? pages : null

  const loadMore = useCallback(() => {
    if (!current?.cursor) return
    setLoadingMore(true)
    load({ search: term || undefined, cursor: current.cursor })
      .then((page) =>
        setPages((previous) =>
          previous && previous.key === current.key
            ? {
                ...previous,
                items: [...previous.items, ...page.items],
                cursor: page.next_cursor,
              }
            : previous
        )
      )
      .catch((cause: unknown) =>
        setPages((previous) =>
          previous
            ? {
                ...previous,
                error: toTemplateError('Organizations request failed', cause),
              }
            : previous
        )
      )
      .finally(() => setLoadingMore(false))
  }, [current, load, term])

  return {
    search,
    setSearch,
    items: current?.items ?? [],
    hasMore: !!current?.cursor,
    loading: (requestKey !== null && current === null) || loadingMore,
    error: current?.error ?? null,
    loadMore,
  }
}
