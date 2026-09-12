'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Input,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import type {
  PeriodFilter,
  TransactionFilters,
  TransactionKind,
  TransactionStatus,
} from '../../domain/transactions'

interface TransactionsToolbarProps {
  filters: TransactionFilters
  onChange: <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => void
}

const PERIODS: PeriodFilter[] = ['all', 'thisMonth', 'last30', 'last90']

const STATUSES: TransactionStatus[] = [
  'successful',
  'pending',
  'failed',
  'refunded',
  'used',
]

const PERIOD_KEY: Record<PeriodFilter, string> = {
  all: 'periodAll',
  thisMonth: 'periodThisMonth',
  last30: 'periodLast30',
  last90: 'periodLast90',
}

export function TransactionsToolbar({
  filters,
  onChange,
}: TransactionsToolbarProps) {
  const t = useTranslations('billing')

  const kinds: { value: TransactionKind | 'all'; label: string }[] = [
    { value: 'all', label: t('transactions.filters.all') },
    { value: 'purchase', label: t('transactions.filters.purchases') },
    { value: 'usage', label: t('transactions.filters.usage') },
  ]

  return (
    <div className="border-border rounded-card flex flex-wrap items-center justify-between gap-3 border p-3">
      <SegmentedControl
        options={kinds}
        value={filters.kind}
        onChange={(value) => onChange('kind', value)}
        aria-label={t('transactions.filters.typeLabel')}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.period}
          onValueChange={(value) => onChange('period', value as PeriodFilter)}
        >
          <SelectTrigger
            className="h-10 w-auto min-w-[9rem]"
            aria-label={t('transactions.filters.periodLabel')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((period) => (
              <SelectItem key={period} value={period}>
                {t(`transactions.filters.${PERIOD_KEY[period]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange('status', value as TransactionFilters['status'])
          }
        >
          <SelectTrigger
            className="h-10 w-auto min-w-[9rem]"
            aria-label={t('transactions.filters.statusLabel')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('transactions.filters.allStatuses')}
            </SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status === 'used'
                  ? t('history.used')
                  : t(`purchaseStatus.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            className="h-10 w-full min-w-48 ps-9 sm:w-60"
            placeholder={t('transactions.filters.searchPlaceholder')}
            aria-label={t('transactions.filters.search')}
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
