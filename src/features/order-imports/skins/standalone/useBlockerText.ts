import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import type { OrderImportStartBlocker } from '../../api/orderImportsApi'

/**
 * One sentence per start blocker. Credit denials reuse the shared
 * `creditErrors.*` copy the manual order form shows, so a merchant reads the
 * same words for the same problem wherever they meet it.
 */
export function useBlockerText() {
  const t = useTranslations('orderImport.start')
  const tCredits = useTranslations('creditErrors')
  return useCallback(
    (blocker: OrderImportStartBlocker): string => {
      const creditKey = creditFeedbackKey(blocker.code)
      if (creditKey) return tCredits(creditKey)
      switch (blocker.code) {
        case 'IMPORT_AUTO_VERIFY_DISABLED':
          return t('autoVerifyTitle')
        case 'IMPORT_PLAN_LIMIT_REACHED':
          return t('blocked.IMPORT_PLAN_LIMIT_REACHED', {
            slots: blocker.slotsRemaining ?? 0,
          })
        case 'IMPORT_START_WINDOW_EXPIRED':
          return t('blocked.IMPORT_START_WINDOW_EXPIRED')
        default:
          return t('blocked.IMPORT_SETUP_INCOMPLETE')
      }
    },
    [t, tCredits]
  )
}
