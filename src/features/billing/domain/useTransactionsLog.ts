'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  EMPTY_FILTERS,
  filterTransactions,
  paginate,
  summarize,
  type TransactionFilters,
} from './transactions'
import { useTransactionLabels } from './useTransactionLabels'
import { useTransactions } from './useTransactions'

const PAGE_SIZE = 10

export function useTransactionsLog() {
  const history = useTransactions()
  const labels = useTransactionLabels()
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => filterTransactions(history.transactions, filters, labels.search),
    [filters, history.transactions, labels.search]
  )

  const pageData = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page]
  )

  const totals = useMemo(
    () => summarize(history.transactions),
    [history.transactions]
  )

  /*
   * Narrowing the set can strand the reader on a page that no longer exists,
   * so every filter change returns to page one. This belongs to the event
   * rather than to an effect watching `filters` — the reset is part of what
   * changing a filter means, not a consequence to reconcile afterwards.
   */
  const setFilter = useCallback(
    <K extends keyof TransactionFilters>(
      key: K,
      value: TransactionFilters[K]
    ) => {
      setFilters((current) => ({ ...current, [key]: value }))
      setPage(1)
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }, [])

  const isFiltered = useMemo(
    () =>
      filters.kind !== 'all' ||
      filters.status !== 'all' ||
      filters.period !== 'all' ||
      filters.query.trim() !== '',
    [filters]
  )

  return {
    ...history,
    labels,
    filters,
    setFilter,
    clearFilters,
    isFiltered,
    page: pageData,
    setPage,
    filtered,
    totals,
  }
}
