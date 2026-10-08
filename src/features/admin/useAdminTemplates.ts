'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminApiError } from './adminApi'
import {
  getAdminTemplate,
  getAdminTemplates,
  runAdminTemplateSync,
  sendAdminTemplateTest,
} from './adminTemplatesApi'
import {
  defaultTemplateRange,
  emptyTemplateFilters,
  filterTemplates,
  isTemplateRangeValid,
  type TemplateDetailResponse,
  type TemplateFilters,
  type TemplateListResponse,
  type TemplateRange,
  type TemplateSyncRun,
} from './admin-templates.model'

function toAdminError(context: string, cause: unknown): AdminApiError {
  console.error(`[Admin] ${context}`, cause)
  return cause instanceof AdminApiError
    ? cause
    : new AdminApiError('Request failed', 0, null)
}

interface LoadResult<T> {
  /** The request this result answers; a different key means one is loading. */
  key: string
  data: T | null
  error: AdminApiError | null
}

/**
 * Loads one admin resource for a date range. The last good answer stays
 * visible while the next one loads; an invalid range is not requested.
 */
function useRangedResource<T>(
  context: string,
  resourceKey: string,
  load: (range: TemplateRange) => Promise<T>
) {
  const [range, setRange] = useState<TemplateRange>(() =>
    defaultTemplateRange()
  )
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<LoadResult<T> | null>(null)
  const rangeValid = isTemplateRangeValid(range)
  const requestKey = `${resourceKey}#${range.from}#${range.to}#${revision}`

  useEffect(() => {
    if (!rangeValid) return
    let current = true
    load(range)
      .then((data) => {
        if (current) setResult({ key: requestKey, data, error: null })
      })
      .catch((cause: unknown) => {
        if (current)
          setResult({
            key: requestKey,
            data: null,
            error: toAdminError(context, cause),
          })
      })
    return () => {
      current = false
    }
  }, [requestKey, rangeValid, range, load, context])

  const loading = rangeValid && result?.key !== requestKey
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  return {
    data: result?.data ?? null,
    error: loading ? null : (result?.error ?? null),
    loading,
    range,
    rangeValid,
    setRange,
    refresh,
  }
}

interface ActionState<T> {
  pending: boolean
  result: T | null
  error: AdminApiError | null
}

const idleAction = { pending: false, result: null, error: null }

export function useAdminTemplates() {
  const resource = useRangedResource<TemplateListResponse>(
    'Template list request failed',
    'list',
    getAdminTemplates
  )
  const [filters, setFilters] = useState<TemplateFilters>(emptyTemplateFilters)
  const [sync, setSync] = useState<ActionState<TemplateSyncRun>>(idleAction)
  const { refresh } = resource

  const all = resource.data?.templates
  const templates = useMemo(
    () => (all ? filterTemplates(all, filters) : []),
    [all, filters]
  )

  const runSync = useCallback(async () => {
    setSync({ pending: true, result: null, error: null })
    try {
      const run = await runAdminTemplateSync()
      setSync({ pending: false, result: run, error: null })
      refresh()
    } catch (cause) {
      setSync({
        pending: false,
        result: null,
        error: toAdminError('Template sync failed', cause),
      })
    }
  }, [refresh])

  function setFilter<K extends keyof TemplateFilters>(
    key: K,
    value: TemplateFilters[K]
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return {
    ...resource,
    page: resource.data,
    templates,
    filters,
    setFilter,
    resetFilters: () => setFilters(emptyTemplateFilters),
    sync,
    runSync,
  }
}

export function useAdminTemplate(key: string) {
  const load = useCallback(
    (range: TemplateRange) => getAdminTemplate(key, range),
    [key]
  )
  const resource = useRangedResource<TemplateDetailResponse>(
    'Template request failed',
    key,
    load
  )
  const [test, setTest] = useState<ActionState<true>>(idleAction)

  const sendTest = useCallback(
    async (phone: string) => {
      setTest({ pending: true, result: null, error: null })
      try {
        await sendAdminTemplateTest(key, phone)
        setTest({ pending: false, result: true, error: null })
      } catch (cause) {
        setTest({
          pending: false,
          result: null,
          error: toAdminError('Template test send failed', cause),
        })
      }
    },
    [key]
  )

  return { ...resource, detail: resource.data, test, sendTest }
}
