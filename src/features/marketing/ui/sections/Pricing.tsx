'use client'

import { useRouter } from 'next/navigation'
import { usePricing } from '@/features/marketing/hooks/usePricing'
import { withLocale } from '@/shared/lib/locale'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { PricingHeader } from './pricing/PricingHeader'
import { PricingDesktopCards } from './pricing/PricingDesktopCards'

export default function Pricing() {
  const { t, tiers, checks } = usePricing()
  const { locale, isRTL } = useLocaleInfo()
  const router = useRouter()
  const handleCtaClick = () => router.push(withLocale('/signup', locale))

  return (
    <Section
      id="pricing"
      className="relative overflow-hidden px-4 sm:px-6 lg:px-10"
    >
      <Container className="relative z-10 max-w-351.5">
        <PricingHeader
          eyebrow={t('eyebrow')}
          title={t.rich('title', {
            highlight: (chunks) => (
              <span className="text-[#119764]">{chunks}</span>
            ),
          })}
          subtitle={t('subtitle')}
          checks={checks}
          isRTL={isRTL}
        />

        <PricingDesktopCards
          tiers={tiers}
          t={t}
          onCtaClick={handleCtaClick}
          isRTL={isRTL}
        />
      </Container>
    </Section>
  )
}
