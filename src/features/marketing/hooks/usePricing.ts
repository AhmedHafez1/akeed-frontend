import { useTranslations } from 'next-intl'
import { pricing } from '@/features/marketing/config/site'

export function usePricing() {
  const t = useTranslations('pricing')
  const { tiers } = pricing

  return {
    t,
    tiers,
  }
}
