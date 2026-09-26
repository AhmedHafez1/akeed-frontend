'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  customerDisplayName,
  formatOrderAmount,
  formatPhoneInternational,
  whatsAppChatUrl,
} from '../lib/orderDisplay'
import type { VerificationItem } from '../model/dashboard.model'
import type { ConfirmationRowActionPlan } from './confirmationRowActions'

export interface ConfirmationRowLink {
  url: string
  content: string
  accessibilityLabel: string
}

/**
 * The row's WhatsApp link, worded for its purpose: a plain chat with a
 * customer who has not answered, or a prefilled shipping message for a
 * confirmed order. Null when the plan has none or the row has no phone.
 */
export function useConfirmationRowLink(
  row: VerificationItem,
  orderLabel: string,
  primary: ConfirmationRowActionPlan['primary']
): ConfirmationRowLink | null {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const name = customerDisplayName(row.customer_name)
  const customer = name ?? formatPhoneInternational(row.customer_phone)

  if (primary === 'chat') {
    const url = whatsAppChatUrl(row.customer_phone)
    return url
      ? {
          url,
          content: t('overview.needsAction.actions.whatsapp'),
          accessibilityLabel: t('overview.needsAction.actions.whatsappLabel', {
            customer,
          }),
        }
      : null
  }

  if (primary === 'shipping') {
    const message = t('confirmations.shipping.message', {
      customer: name ?? t('confirmations.shipping.customerFallback'),
      order: orderLabel,
      total: formatOrderAmount(row.total_price, row.currency, locale),
    })
    const url = whatsAppChatUrl(row.customer_phone, message)
    return url
      ? {
          url,
          content: t('confirmations.actions.sendShipping'),
          accessibilityLabel: t('confirmations.actions.sendShippingLabel', {
            customer,
          }),
        }
      : null
  }

  return null
}
