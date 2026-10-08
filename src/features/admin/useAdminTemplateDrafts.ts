'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminApiError } from './adminApi'
import {
  checkTemplateDraft,
  getTemplateDraft,
  getTemplateDrafts,
  getTemplateImpact,
} from './adminTemplateDraftsApi'
import type {
  TemplateDraftCheck,
  TemplateDraftForm,
} from './admin-template-drafts.model'

export function toTemplateError(
  context: string,
  cause: unknown
): AdminApiError {
  console.error(`[Admin] ${context}`, cause)
  return cause instanceof AdminApiError
    ? cause
    : new AdminApiError('Request failed', 0, null)
}

interface Loaded<T> {
  key: string
  data: T | null
  error: AdminApiError | null
}

/** Loads one resource; the last good answer stays while the next loads. */
function useResource<T>(
  context: string,
  resourceKey: string | null,
  load: () => Promise<T>
) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<Loaded<T> | null>(null)
  const requestKey = resourceKey === null ? null : `${resourceKey}#${revision}`

  useEffect(() => {
    if (requestKey === null) return
    let current = true
    load()
      .then((data) => {
        if (current) setResult({ key: requestKey, data, error: null })
      })
      .catch((cause: unknown) => {
        if (current)
          setResult({
            key: requestKey,
            data: null,
            error: toTemplateError(context, cause),
          })
      })
    return () => {
      current = false
    }
  }, [requestKey, load, context])

  const loading = requestKey !== null && result?.key !== requestKey
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  return {
    data: requestKey === null ? null : (result?.data ?? null),
    error: loading ? null : (result?.error ?? null),
    loading,
    refresh,
  }
}

export function useTemplateDrafts() {
  return useResource(
    'Template drafts request failed',
    'drafts',
    getTemplateDrafts
  )
}

export function useTemplateDraft(id: string) {
  const load = useCallback(() => getTemplateDraft(id), [id])
  return useResource('Template draft request failed', id, load)
}

/** What an action on a registry template would touch; null key loads nothing. */
export function useTemplateImpact(key: string | null) {
  const load = useCallback(() => getTemplateImpact(key ?? ''), [key])
  return useResource('Template impact request failed', key, load)
}

/** One write and its outcome. A second call while one runs is ignored. */
export function useTemplateAction<T>(context: string) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [result, setResult] = useState<T | null>(null)

  const run = useCallback(
    async (work: () => Promise<T>): Promise<T | null> => {
      setPending(true)
      setError(null)
      try {
        const value = await work()
        setResult(value)
        return value
      } catch (cause) {
        setError(toTemplateError(context, cause))
        return null
      } finally {
        setPending(false)
      }
    },
    [context]
  )
  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])
  return { pending, error, result, run, reset }
}

const CHECK_DELAY_MS = 400

/**
 * Asks the backend to validate the form a moment after the operator stops
 * typing. The rules live in one place, the backend; the form only shows them.
 */
export function useDraftCheck(
  form: TemplateDraftForm | null,
  options: { enabled: boolean; draftId?: string }
) {
  const [state, setState] = useState<{
    signature: string
    check: TemplateDraftCheck | null
    error: AdminApiError | null
  } | null>(null)
  const signature =
    form && options.enabled
      ? JSON.stringify([form, options.draftId ?? null])
      : null

  useEffect(() => {
    if (signature === null || !form) return
    let current = true
    const timer = setTimeout(() => {
      checkTemplateDraft(form, options.draftId)
        .then((check) => {
          if (current) setState({ signature, check, error: null })
        })
        .catch((cause: unknown) => {
          if (current)
            setState({
              signature,
              check: null,
              error: toTemplateError('Template draft check failed', cause),
            })
        })
    }, CHECK_DELAY_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
    // `form` is covered by `signature`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const fresh = signature !== null && state?.signature === signature
  return {
    check: fresh ? state.check : null,
    error: fresh ? state.error : null,
    checking: signature !== null && !fresh,
  }
}
