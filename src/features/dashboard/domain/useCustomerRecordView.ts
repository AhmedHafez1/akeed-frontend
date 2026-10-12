'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCount } from '../lib/orderDisplay'
import type { CustomerHistory } from '../model/dashboard.model'
import {
  resolveCustomerRecord,
  type CustomerRecordKind,
} from './customerRecord'

export interface CustomerRecordView {
  kind: CustomerRecordKind
  /** One short line: "New customer", "Repeat customer · 3 confirmed". */
  label: string
  /**
   * What a one-line table cell shows: "unconfirmed/other orders" for a
   * customer who left orders unconfirmed, nothing for anyone else.
   */
  compact: string | null
  /** Every count spelled out, for a tooltip or the details view. */
  summary: string
  /** Whether the list shows a chip; a first order stays quiet there. */
  showInList: boolean
}

/** A customer's track record worded once for both skins. */
export function useCustomerRecordView(
  history: CustomerHistory | null | undefined
): CustomerRecordView | null {
  const t = useTranslations('dashboard.confirmations.customer')
  const { locale } = useLocaleInfo()
  const record = resolveCustomerRecord(history)
  if (!record) return null

  const counts = {
    orders: formatCount(record.otherOrders, locale),
    confirmed: formatCount(record.confirmed, locale),
    canceled: formatCount(record.canceled, locale),
    noReply: formatCount(record.noReply, locale),
    unconfirmed: formatCount(record.unconfirmed, locale),
  }
  return {
    kind: record.kind,
    label: t(record.kind, counts),
    compact:
      record.kind === 'risk' ? `${counts.unconfirmed}/${counts.orders}` : null,
    summary: record.kind === 'new' ? t('new') : t('summary', counts),
    showInList: record.kind === 'repeat' || record.kind === 'risk',
  }
}
