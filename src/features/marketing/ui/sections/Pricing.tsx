'use client'

import { usePricing } from '@/features/marketing/hooks/usePricing'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { openShopifyAppStore } from '@/shared/lib/shopify-auth'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { PricingHeader } from './pricing/PricingHeader'
import { PricingDesktopCards } from './pricing/PricingDesktopCards'

export default function Pricing() {
  const { t, tiers } = usePricing()
  const { isRTL } = useLocaleInfo()

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
          isRTL={isRTL}
        />

        <PricingDesktopCards
          tiers={tiers}
          t={t}
          onCtaClick={openShopifyAppStore}
          isRTL={isRTL}
        />
      </Container>
    </Section>
  )
}
