'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { VerificationItem } from '../model/dashboard.model'
import { resolveRowStatus } from './confirmationRowStatus'
import { formatTooltipDateTime, getStatusTimestamp } from './verificationRow'

/**
 * What hovering a row's status badge says, the same in both modes: when a
 * scheduled message goes out, when the reminder for an unanswered one is due,
 * and otherwise when the row reached its current status. Undefined when there
 * is no time to show.
 */
export function useStatusTooltip(
  row: VerificationItem,
  timeZone: string
): string | undefined {
  const t = useTranslations('dashboard.confirmations.status.tooltip')
  const { locale } = useLocaleInfo()
  const format = (value: string | null | undefined) =>
    formatTooltipDateTime(value ?? null, locale, timeZone)

  const { badge, kind } = resolveRowStatus(row)
  if (kind === 'scheduled' && row.scheduled_for) {
    return t('scheduledFor', { time: format(row.scheduled_for) })
  }
  if (badge === 'awaitingReply' && row.follow_up_scheduled_for) {
    return t('reminderAt', { time: format(row.follow_up_scheduled_for) })
  }
  return format(getStatusTimestamp(row)) || undefined
}
