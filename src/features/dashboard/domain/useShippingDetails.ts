'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type {
  NeedsActionReason,
  ShippingSummary,
} from '../model/dashboard.model'
import {
  isShippingReason,
  safeTrackingUrl,
  shippingCellView,
  shippingRequestKind,
  type ShippingBadge,
} from './shippingStatus'
import { formatTooltipDateTime } from './verificationRow'

export interface ShippingDetailsView {
  /** Why it was sent: the order was fulfilled, or the tag that sent it. */
  trigger: string
  /** The status word: Sent, Delivered, Read, Pending, or the failure badge. */
  status: string
  /** The badge family, for the skin's colour; null while pending. */
  badge: ShippingBadge | null
  /** When it was sent or failed. */
  time: string
  /** Why it was not sent, written out; null otherwise. */
  reason: string | null
  tracking: { number: string | null; url: string | null } | null
  /** The customer's button, in the merchant's language; null without one. */
  reply: string | null
  /**
   * What the merchant should do, while it is open: the customer asked to
   * reschedule or change the address, or the message did not reach them.
   */
  open: string | null
  /** When it was marked done; null otherwise. */
  resolved: string | null
}

/** The details view's Shipping section, worded once for both skins. */
export function useShippingDetails(
  shipping: ShippingSummary | null | undefined,
  actionReason: NeedsActionReason | null | undefined,
  timeZone: string
): ShippingDetailsView | null {
  const t = useTranslations('dashboard.shipping')
  const { locale } = useLocaleInfo()
  if (!shipping) return null
  const time = (iso: string | null) =>
    formatTooltipDateTime(iso, locale, timeZone)
  const cell = shippingCellView(shipping)
  const status =
    shipping.status === 'delivered' || shipping.status === 'read'
      ? t(`details.status.${shipping.status}`)
      : cell
        ? t(`badges.${cell.badge}`)
        : t('details.status.pending')
  const request = shippingRequestKind(shipping)
  const isOpen = isShippingReason(actionReason)
  return {
    trigger:
      shipping.trigger === 'tag' && shipping.matched_tag
        ? t('details.triggerTag', { tag: shipping.matched_tag })
        : t('details.triggerFulfillment'),
    status,
    badge: cell?.badge ?? null,
    time: time(shipping.updated_at),
    reason: cell?.reason ? t(`reasons.${cell.reason}`) : null,
    tracking:
      shipping.tracking_number || shipping.tracking_url
        ? {
            number: shipping.tracking_number,
            url: safeTrackingUrl(shipping.tracking_url),
          }
        : null,
    reply: shipping.customer_reply
      ? t(`details.replies.${shipping.customer_reply}`)
      : null,
    open: !isOpen
      ? null
      : actionReason === 'shipping_not_reachable'
        ? t('details.notReached')
        : request === 'address'
          ? t('details.requestAddress')
          : t('details.requestReschedule'),
    resolved: shipping.resolved_at
      ? t('details.doneAt', { time: time(shipping.resolved_at) })
      : null,
  }
}
