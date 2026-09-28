'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatShortDate } from '../lib/orderDisplay'
import type { NeedsActionItem } from '../model/dashboard.model'
import { deliveryFailureKey } from './deliveryFailure'

/**
 * Why an order is waiting on the merchant, as one short line. A failed
 * delivery is critical; everything else is a quiet note.
 */
export function useNeedsActionReason(
  reason: NeedsActionItem['reason'],
  timeZone: string
): { text: string; isCritical: boolean } {
  const t = useTranslations('dashboard.overview.needsAction.reason')
  const tFailure = useTranslations('dashboard.confirmations.status.failure')
  const { locale } = useLocaleInfo()

  if (reason.type === 'delivery_failed') {
    return {
      text: t('delivery_failed', {
        reason: tFailure(deliveryFailureKey(reason.failure_code)),
      }),
      isCritical: true,
    }
  }
  return {
    text:
      reason.type === 'read_no_reply'
        ? t('read_no_reply', { hours: reason.hours ?? 0 })
        : t(reason.type, {
            date: formatShortDate(reason.since, locale, timeZone),
          }),
    isCritical: false,
  }
}
