'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminRequest } from './adminApi'
import type {
  PilotApplyReport,
  PilotList,
  PilotPreview,
} from './standalone-pilot.model'

const path = '/api/admin/standalone-pilots'

export function useStandalonePilots() {
  const [page, setPage] = useState<PilotList | null>(null)
  const [cursors, setCursors] = useState<string[]>([])
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<PilotPreview | null>(null)
  const [report, setReport] = useState<PilotApplyReport | null>(null)
  const [reason, setReason] = useState('')
  const cursor = cursors.at(-1)

  const recordError = useCallback((cause: unknown) => {
    console.error('[Admin] Pilot request failed', cause)
    setError(
      cause instanceof AdminApiError
        ? cause
        : new AdminApiError('Request failed', 0, null)
    )
  }, [])

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(null)
    adminRequest<PilotList>(
      `${path}?limit=50${cursor ? `&cursor=${cursor}` : ''}`
    )
      .then((response) => {
        if (current) setPage(response)
      })
      .catch((cause: unknown) => {
        if (current) {
          setPage(null)
          recordError(cause)
        }
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [cursor, revision, recordError])

  function toggle(orgId: string) {
    if (busy || loading) return
    setSelected((current) =>
      current.includes(orgId)
        ? current.filter((id) => id !== orgId)
        : current.length < 50
          ? [...current, orgId]
          : current
    )
    setPreview(null)
    setReport(null)
  }

  async function createPreview() {
    if (busy || !selected.length) return
    setBusy('preview')
    setError(null)
    setPreview(null)
    setReport(null)
    try {
      setPreview(
        await adminRequest<PilotPreview>(`${path}/preview`, {
          method: 'POST',
          body: JSON.stringify({ organizationIds: selected }),
        })
      )
    } catch (cause) {
      recordError(cause)
    } finally {
      setBusy(null)
    }
  }

  async function apply() {
    if (
      busy ||
      !preview?.activationEnabled ||
      !page?.activationEnabled ||
      !preview.counts.eligible ||
      !reason.trim()
    )
      return
    setBusy('apply')
    setError(null)
    try {
      setReport(
        await adminRequest<PilotApplyReport>(`${path}/apply`, {
          method: 'POST',
          body: JSON.stringify({
            previewId: preview.previewId,
            reason: reason.trim(),
          }),
        })
      )
      setRevision((value) => value + 1)
    } catch (cause) {
      recordError(cause)
      if (cause instanceof AdminApiError && cause.status === 403)
        setPreview((current) =>
          current ? { ...current, activationEnabled: false } : null
        )
    } finally {
      setBusy(null)
    }
  }

  return {
    page,
    loading,
    busy,
    error,
    selected,
    preview,
    report,
    reason,
    setReason,
    toggle,
    createPreview,
    apply,
    refresh: () => setRevision((value) => value + 1),
    clearSelection: () => {
      setSelected([])
      setPreview(null)
      setReport(null)
    },
    next: () => {
      if (page?.nextCursor)
        setCursors((current) => [...current, page.nextCursor!])
    },
    previous: () => setCursors((current) => current.slice(0, -1)),
    hasPrevious: cursors.length > 0,
  }
}

export function downloadPilotReport(report: PilotPreview | PilotApplyReport) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `standalone-pilots-${report.previewId}-${'results' in report ? 'results' : 'preview'}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
