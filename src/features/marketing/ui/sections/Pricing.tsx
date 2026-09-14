'use client'

import { useTranslations } from 'next-intl'
import { LandingSectionHeading } from '@/features/marketing/ui/components/LandingSectionHeading'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { CreditModelExplainer } from './pricing/CreditModelExplainer'
import { CreditPresetLadder } from './pricing/CreditPresetLadder'
import { CreditPriceCard } from './pricing/CreditPriceCard'
import { ShopifyPathCard } from './pricing/ShopifyPathCard'

export default function Pricing() {
  const t = useTranslations('pricing_credits')
  const { isRTL } = useLocaleInfo()

  return (
    // No `overflow-hidden` here: the cards below lift and cast a wider shadow
    // on hover, and clipping to the section bounds shears it off at the edges.
    <Section id="pricing" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        <LandingSectionHeading
          eyebrow={t('eyebrow')}
          title={t.rich('title', {
            // Was a literal `#119764`, which ignored the theme entirely. The
            // token is the same emerald and follows the palette.
            highlight: (chunks) => (
              <span className="text-primary">{chunks}</span>
            ),
          })}
          description={t('subtitle')}
          isRTL={isRTL}
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <CreditPriceCard />
          <ShopifyPathCard />
        </div>

        <div className="mt-10">
          <CreditModelExplainer />
        </div>

        <div className="mt-10">
          <CreditPresetLadder />
        </div>

        <p
          className={cn(
            'text-muted-foreground mt-8 text-sm leading-6',
            isRTL ? 'text-right' : 'text-left'
          )}
        >
          {t('authoritative_note')}
        </p>
      </Container>
    </Section>
  )
}
