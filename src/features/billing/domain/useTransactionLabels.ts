'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { BadgeProps } from '@/shared/ui'
import {
  transactionStatus,
  type Transaction,
  type TransactionStatus,
} from './transactions'

const STATUS_TONE: Record<TransactionStatus, BadgeProps['variant']> = {
  successful: 'success',
  pending: 'warning',
  failed: 'danger',
  canceled: 'danger',
  expired: 'danger',
  refunded: 'info',
  used: 'neutral',
  posted: 'neutral',
}

export interface TransactionLabels {
  /** Bold first line: what kind of movement this was. */
  title: (item: Transaction) => string
  /** Muted second line: why it happened, and who caused it when that matters. */
  detail: (item: Transaction) => string
  status: (item: Transaction) => { label: string; tone: BadgeProps['variant'] }
  /** Everything a row renders as text, for free-text search. */
  search: (item: Transaction) => string
}

/**
 * Bridges the i18n catalogue into the pure transaction module, which takes
 * `labelOf` as a parameter precisely so it never has to import next-intl.
 */
export function useTransactionLabels(): TransactionLabels {
  const t = useTranslations('billing')

  const title = useCallback(
    (item: Transaction) => t(`history.kind.${item.kind}`),
    [t]
  )

  const detail = useCallback(
    (item: Transaction) => {
      const reason = t(`ledgerReason.${item.reasonCode}`)
      // `system` and `meta` add nothing a merchant can act on; a payment
      // processor or an Akeed staff member is worth naming.
      return item.actorType === 'paymob' || item.actorType === 'akeed_staff'
        ? `${t(`actorType.${item.actorType}`)} · ${reason}`
        : reason
    },
    [t]
  )

  const status = useCallback(
    (item: Transaction) => {
      const value = transactionStatus(item)
      const label =
        value === 'used' || value === 'posted'
          ? t(`history.${value}`)
          : t(`purchaseStatus.${value}`)
      return { label, tone: STATUS_TONE[value] }
    },
    [t]
  )

  const search = useCallback(
    (item: Transaction) => `${title(item)} ${detail(item)}`,
    [detail, title]
  )

  return useMemo(
    () => ({ title, detail, status, search }),
    [detail, search, status, title]
  )
}
