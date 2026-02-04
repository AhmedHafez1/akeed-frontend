import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { pricing } from '@/config/site'

export function usePricing() {
  const t = useTranslations('pricing')
  const { tiers } = pricing
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)

  const checks = useMemo(() => [t('check_1'), t('check_2'), t('check_3')], [t])

  return {
    t,
    tiers,
    checks,
    isReservationModalOpen,
    openReservationModal: () => setIsReservationModalOpen(true),
    closeReservationModal: () => setIsReservationModalOpen(false),
  }
}
