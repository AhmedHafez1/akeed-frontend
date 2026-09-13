'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminApiError } from './adminApi'
import {
  getBillingFindings,
  getBillingHealth,
  requestBillingReconciliation,
} from './billingObservabilityApi'
import type {
  BillingFindingFilters,
  BillingFindingsPage,
  BillingHealth,
} from './billing-observability.model'

export type BillingRange = '7' | '30' | '90' | 'all'

const initialFilters: BillingFindingFilters = {
  status: 'open',
  severity: '',
  code: '',
}

function rangeDates(range: BillingRange) {
  if (range === 'all') return {}
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - Number(range))
  return { from: from.toISOString(), to: to.toISOString() }
}

export function useBillingObservability() {
  const [range, setRange] = useState<BillingRange>('30')
  const [filters, setFilters] = useState(initialFilters)
  const [health, setHealth] = useState<BillingHealth | null>(null)
  const [findings, setFindings] = useState<BillingFindingsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [revision, setRevision] = useState(0)
  const dates = useMemo(() => rangeDates(range), [range])

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(null)
    Promise.all([
      getBillingHealth(dates.from, dates.to),
      getBillingFindings(filters),
    ])
      .then(([nextHealth, nextFindings]) => {
        if (!current) return
        setHealth(nextHealth)
        setFindings(nextFindings)
      })
      .catch((cause: unknown) => {
        console.error('[Admin] Billing observability request failed', cause)
        if (current)
          setError(
            cause instanceof AdminApiError
              ? cause
              : new AdminApiError('Request failed', 0, null)
          )
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [dates.from, dates.to, filters, revision])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  async function run(reason: string) {
    setBusy(true)
    setError(null)
    try {
      await requestBillingReconciliation(reason)
      refresh()
    } catch (cause) {
      console.error('[Admin] Billing reconciliation enqueue failed', cause)
      setError(
        cause instanceof AdminApiError
          ? cause
          : new AdminApiError('Request failed', 0, null)
      )
    } finally {
      setBusy(false)
    }
  }

  return {
    range,
    setRange,
    filters,
    setFilters,
    health,
    findings,
    loading,
    busy,
    error,
    refresh,
    run,
  }
}
