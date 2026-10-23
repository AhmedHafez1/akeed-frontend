'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { VerificationItem } from '../model/dashboard.model'
import { autoCancelMarker, type AutoCancelMarker } from './autoCancel'
import { formatTooltipDateTime } from './verificationRow'

/**
 * The words of a row's automatic-cancellation marker, for its tooltip and
 * accessible name. The table shows only an icon, so the row stays one line.
 */
export function useAutoCancelMarker(
  row: VerificationItem,
  timeZone: string
): { marker: AutoCancelMarker; text: string } | null {
  const t = useTranslations('dashboard.confirmations.autoCancel.marker')
  const { locale } = useLocaleInfo()
  const marker = autoCancelMarker(row)
  if (!marker) return null
  switch (marker.key) {
    case 'scheduled':
      return {
        marker,
        text: t('scheduled', {
          time: formatTooltipDateTime(marker.time, locale, timeZone),
        }),
      }
    case 'paused':
      return {
        marker,
        text: t('paused', { reason: t(`pausedReasons.${marker.reason}`) }),
      }
    default:
      return { marker, text: t(marker.key) }
  }
}

const SKIP_REASONS = [
  'paid',
  'fulfilled',
  'fulfillment_in_progress',
  'status_not_writable',
  'order_not_found',
  'source_unsupported',
] as const
const STOP_REASONS = [
  'customer_reply',
  'excluded',
  'feature_disabled',
  'status_changed',
] as const

function known<T extends string>(
  list: readonly T[],
  value: string | null
): T | 'other' {
  return (list as readonly string[]).includes(value ?? '')
    ? (value as T)
    : 'other'
}

/**
 * The whole story for the details view, including how it ended: canceled
 * for no response, left alone because the store had moved on, or stopped.
 * Null when nothing was decided or projected for the order.
 */
export function useAutoCancelDetail(
  row: VerificationItem,
  timeZone: string
): string | null {
  const t = useTranslations('dashboard.confirmations.autoCancel.detail')
  const marker = useAutoCancelMarker(row, timeZone)
  const view = row.auto_cancel
  if (!view) return null
  if (view.state === 'succeeded') {
    return view.late_reply ? t('canceledLateReply') : t('canceled')
  }
  if (marker) return marker.text
  if (view.state === 'skipped')
    return t('skipped', {
      reason: t(`skipReasons.${known(SKIP_REASONS, view.reason)}`),
    })
  if (view.state === 'stopped')
    return t('stopped', {
      reason: t(`stopReasons.${known(STOP_REASONS, view.reason)}`),
    })
  return t('waiting')
}
