'use client'

import { useTranslations } from 'next-intl'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { CreditPriceCard } from './pricing/CreditPriceCard'
import { PricingFactsPanel } from './pricing/PricingFactsPanel'

export default function Pricing() {
  const t = useTranslations('pricing_credits')
  const { isRTL } = useLocaleInfo()

  return (
    // No `overflow-hidden` here: the card casts a wide soft shadow, and
    // clipping to the section bounds shears it off at the edges.
    <Section id="pricing" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-6xl">
        <LandingSectionHeading
          eyebrow={t('eyebrow')}
          title={t.rich('title', {
            // Was a literal `#119764`, which ignored the theme entirely. The
            // token is the same emerald and follows the palette.
            highlight: (chunks) => <span className="text-primary">{chunks}</span>,
          })}
          description={t('subtitle')}
          isRTL={isRTL}
        />

        {/*
         * One card, split. The ink half carries the price and the slider; the
         * light half explains billing. Two panels of one object read calmer
         * than the five separate blocks this section used to stack.
         */}
        <div className="ring-border shadow-overlay grid overflow-hidden rounded-3xl ring-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <CreditPriceCard />
          <PricingFactsPanel />
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs leading-5">
          {t('authoritative_note')}
        </p>
      </Container>
    </Section>
  )
}
