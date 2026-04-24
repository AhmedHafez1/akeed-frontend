'use client'

import { BadgePercent, Headset } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  LandingIconBadge,
  landingInsetCardClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { usePricing } from '@/features/marketing/hooks/usePricing'
import { cn } from '@/shared/lib/utils'
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

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2 lg:mt-10">
          <div
            className={cn(landingInsetCardClass, 'px-5 py-5 sm:px-7 sm:py-6')}
          >
            <div
              className={cn(
                'flex items-center gap-4',
                isRTL && 'text-right md:flex-row-reverse'
              )}
            >
              <LandingIconBadge icon={BadgePercent} size="sm" />

              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {t('overage_title')}
                </p>
                <p className="mt-1 text-base leading-7 text-slate-500">
                  {t('overage_description')}
                </p>
              </div>
            </div>
          </div>

          <div
            className={cn(landingInsetCardClass, 'px-5 py-5 sm:px-7 sm:py-6')}
          >
            <div
              className={cn(
                'flex items-center gap-4',
                isRTL && 'text-right md:flex-row-reverse'
              )}
            >
              <LandingIconBadge icon={Headset} size="sm" />

              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {t('custom_plan_title')}
                </p>
                <p className="mt-1 text-base leading-7 text-slate-500">
                  {t('custom_plan_description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
