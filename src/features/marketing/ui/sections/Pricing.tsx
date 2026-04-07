'use client'

import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { PricingHeader } from './pricing/PricingHeader'
import { PricingMobileCards } from './pricing/PricingMobileCards'
import { PricingDesktopTable } from './pricing/PricingDesktopTable'
import { usePricing } from '@/features/marketing/hooks/usePricing'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { useRouter } from 'next/navigation'
import { withLocale } from '@/shared/lib/locale'

export default function Pricing() {
  const { t, tiers, checks } = usePricing()
  const { locale } = useLocaleInfo()
  const router = useRouter()

  return (
    <Section id="pricing" className="px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48">
      <Container>
        <PricingHeader
          title={t('title')}
          subtitle={t('subtitle')}
          checks={checks}
        />

        <PricingMobileCards tiers={tiers} t={t} />

        <PricingDesktopTable
          tiers={tiers}
          t={t}
          onCtaClick={() => router.push(withLocale('/signup', locale))}
        />
      </Container>
    </Section>
  )
}
