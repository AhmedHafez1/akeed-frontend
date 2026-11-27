'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { ShippingSummary } from '../model/dashboard.model'
import type { ShippingCellView } from './shippingStatus'
import { formatTooltipDateTime } from './verificationRow'

/**
 * What hovering the Shipping cell says, the same in both modes: when the
 * request was marked done, when the customer replied, why the message did not
 * go out, or how far it got (Sent, Delivered, Read). The record keeps no
 * delivered or read time, so those carry none.
 */
export function useShippingTooltip(
  shipping: ShippingSummary | null | undefined,
  view: ShippingCellView | null,
  timeZone: string
): string {
  const t = useTranslations('dashboard.shipping')
  const { locale } = useLocaleInfo()
  if (!shipping || !view) return ''
  const format = (value: string | null) =>
    formatTooltipDateTime(value, locale, timeZone)
  if (view.done) {
    const doneAt = format(shipping.resolved_at)
    return doneAt ? t('details.doneAt', { time: doneAt }) : ''
  }
  if (shipping.customer_reply) {
    const repliedAt = format(shipping.customer_replied_at)
    const reply = t(`badges.${view.badge}`)
    return repliedAt ? t('replyAt', { reply, time: repliedAt }) : reply
  }
  if (view.badge === 'sent') {
    return shipping.status === 'delivered' || shipping.status === 'read'
      ? t(`details.status.${shipping.status}`)
      : t('badges.sent')
  }
  return view.reason ? t(`reasons.${view.reason}`) : ''
}
