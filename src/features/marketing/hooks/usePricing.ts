import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { pricing } from '@/features/marketing/config/site'

export function usePricing() {
  const t = useTranslations('pricing')
  const { tiers } = pricing

  const checks = useMemo(
    () => [
      { key: 'whatsapp', label: t('check_1') },
      { key: 'security', label: t('check_2') },
      { key: 'pricing', label: t('check_3') },
    ],
    [t]
  )

  return {
    t,
    tiers,
    checks,
  }
}
