'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { VerificationItem } from '../model/dashboard.model'
import { resolveRowStatus } from './confirmationRowStatus'
import { formatTooltipDateTime, getStatusTimestamp } from './verificationRow'

/** Which tooltip sentence a settled row's sub-line stands for. */
const CONFIRMED_TOOLTIPS: Record<string, string> = {
  'sub.manual': 'confirmedManually',
  'sub.afterFollowUp': 'confirmedAfterReminder',
}
const CANCELED_TOOLTIPS: Record<string, string> = {
  'sub.canceledAutomatically': 'canceledAutomatically',
  'sub.canceledInStore': 'canceledInStore',
  'sub.canceledNoReply': 'canceledNoReply',
  'sub.canceledNoWhatsApp': 'canceledNoWhatsApp',
}

/**
 * What hovering a row's status badge says, the same in both modes: what
 * happened and when. A scheduled message says when it goes out, an
 * unanswered one when its reminder is due. Undefined when there is nothing
 * to add to the badge.
 */
export function useStatusTooltip(
  row: VerificationItem,
  timeZone: string,
  options: { showStoreCancellation?: boolean } = {}
): string | undefined {
  const t = useTranslations('dashboard.confirmations.status')
  const { locale } = useLocaleInfo()
  const format = (value: string | null | undefined) =>
    formatTooltipDateTime(value ?? null, locale, timeZone)

  const { badge, kind, sub } = resolveRowStatus(row, options)
  if (row.change_request) {
    const openedAt = format(row.change_request.opened_at)
    return openedAt
      ? t('tooltip.changeRequested', { time: openedAt })
      : undefined
  }
  const time = format(getStatusTimestamp(row))
  // The table row has room for the badge only, so the advice rides here.
  if (kind === 'noWhatsApp') {
    return time
      ? t('tooltip.callCustomerSince', { time })
      : t('tooltip.callCustomer')
  }
  if (badge === 'confirmedAfterCancel') {
    return time ? t('tooltip.confirmedAfterCancel', { time }) : undefined
  }
  if (kind === 'scheduled' && row.scheduled_for) {
    return t('tooltip.scheduledFor', { time: format(row.scheduled_for) })
  }
  if (badge === 'awaitingReply' && row.follow_up_scheduled_for) {
    return t('tooltip.reminderAt', {
      time: format(row.follow_up_scheduled_for),
    })
  }
  switch (badge) {
    case 'confirmed': {
      if (!time) return undefined
      const key =
        (sub && CONFIRMED_TOOLTIPS[sub]) ??
        (row.confirmation_source === 'customer' ? 'confirmedByCustomer' : null)
      return key ? t(`tooltip.${key}`, { time }) : time
    }
    case 'canceled': {
      const key = (sub && CANCELED_TOOLTIPS[sub]) ?? 'canceledByCustomer'
      return time ? t(`tooltip.${key}`, { time }) : undefined
    }
    case 'failed':
      return sub ? t('tooltip.failed', { reason: t(sub) }) : undefined
    case 'blocked':
      return t('tooltip.blocked')
    case 'noReply':
      return time ? t('tooltip.noReplySince', { time }) : undefined
    default:
      return time || undefined
  }
}
