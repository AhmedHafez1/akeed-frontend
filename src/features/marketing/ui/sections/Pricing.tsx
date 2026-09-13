'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { cn } from '@/shared/lib/utils'
import { CreditModelExplainer } from './pricing/CreditModelExplainer'
import { CreditPresetLadder } from './pricing/CreditPresetLadder'
import { CreditPriceCard } from './pricing/CreditPriceCard'
import { ShopifyPathCard } from './pricing/ShopifyPathCard'

export default function Pricing() {
  const t = useTranslations('pricing_credits')
  const { isRTL } = useLocaleInfo()

  return (
    <Section
      id="pricing"
      className="relative overflow-hidden px-4 sm:px-6 lg:px-10"
    >
      <Container className="relative z-10 max-w-351.5">
        <div className={cn('mb-10', isRTL ? 'text-right' : 'text-left')}>
          <p className="text-primary text-sm font-semibold">{t('eyebrow')}</p>
          <h2 className="text-foreground mt-3 text-3xl font-bold text-balance sm:text-4xl">
            {t.rich('title', {
              highlight: (chunks) => (
                <span className="text-[#119764]">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7 text-pretty">
            {t('subtitle')}
          </p>
        </div>

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

        <p className="text-muted-foreground mt-8 text-xs leading-5">
          {t('authoritative_note')}
        </p>
      </Container>
    </Section>
  )
}
