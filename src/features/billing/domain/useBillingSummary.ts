'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { fetchCreditSummary } from '../api/billingApi'
import type { CreditSummary } from './billing.types'

interface BillingContextValue {
  summary: CreditSummary | null
  isLoading: boolean
  error: unknown
  refresh: () => Promise<void>
}

const BillingContext = createContext<BillingContextValue | null>(null)

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      setSummary(await fetchCreditSummary())
    } catch (cause) {
      setError(cause)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ summary, isLoading, error, refresh }),
    [error, isLoading, refresh, summary]
  )

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  )
}

export function useBillingSummary() {
  const value = useContext(BillingContext)
  if (!value) throw new Error('useBillingSummary requires BillingProvider')
  return value
}
