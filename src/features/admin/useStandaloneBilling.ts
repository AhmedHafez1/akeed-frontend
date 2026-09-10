'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminRequest } from './adminApi'
import type {
  AccountFilters,
  ApprovalApplyReport,
  ApprovalPreview,
  CreditAccountList,
} from './standalone-billing.model'

const path = '/api/admin/standalone-billing'

export const emptyAccountFilters: AccountFilters = {
  approval: '',
  accountStatus: '',
  balance: '',
  reconciliation: '',
}

function accountQuery(filters: AccountFilters, cursor: string | undefined) {
  const query = new URLSearchParams({ limit: '50' })
  if (cursor) query.set('cursor', cursor)
  for (const [key, value] of Object.entries(filters))
    if (value) query.set(key, value)
  return query.toString()
}

export function useStandaloneBilling() {
  const [page, setPage] = useState<CreditAccountList | null>(null)
  const [cursors, setCursors] = useState<string[]>([])
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<ApprovalPreview | null>(null)
  const [report, setReport] = useState<ApprovalApplyReport | null>(null)
  const [reason, setReason] = useState('')
  const [filters, setFilterState] =
    useState<AccountFilters>(emptyAccountFilters)
  const cursor = cursors.at(-1)

  const recordError = useCallback((cause: unknown) => {
    console.error('[Admin] Standalone billing request failed', cause)
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
    adminRequest<CreditAccountList>(
      `${path}/accounts?${accountQuery(filters, cursor)}`
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
  }, [cursor, filters, revision, recordError])

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
        await adminRequest<ApprovalPreview>(`${path}/approvals/preview`, {
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
      !preview?.approvalEnabled ||
      !page?.approvalEnabled ||
      !preview.counts.eligible ||
      !reason.trim()
    )
      return
    setBusy('apply')
    setError(null)
    try {
      setReport(
        await adminRequest<ApprovalApplyReport>(`${path}/approvals/apply`, {
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
          current ? { ...current, approvalEnabled: false } : null
        )
    } finally {
      setBusy(null)
    }
  }

  /** A new filter starts again from the first page. */
  function setFilter<K extends keyof AccountFilters>(
    key: K,
    value: AccountFilters[K]
  ) {
    setCursors([])
    setFilterState((current) => ({ ...current, [key]: value }))
  }

  return {
    page,
    filters,
    setFilter,
    resetFilters: () => {
      setCursors([])
      setFilterState(emptyAccountFilters)
    },
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

export function downloadApprovalReport(
  report: ApprovalPreview | ApprovalApplyReport
) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `standalone-billing-${report.previewId}-${'results' in report ? 'results' : 'preview'}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
