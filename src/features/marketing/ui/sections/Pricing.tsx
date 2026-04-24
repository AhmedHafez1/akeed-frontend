'use client'

import { BadgePercent, Headset } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
      className="relative overflow-hidden bg-[#fffcf8] px-4 sm:px-6 lg:px-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.09),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-8 left-6 hidden h-32 w-40 opacity-70 md:block"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(16, 185, 129, 0.24) 1.4px, transparent 1.4px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-24 hidden h-[420px] w-[420px] opacity-70 lg:block"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at center, transparent 0 13px, rgba(16, 185, 129, 0.12) 13px 14px)',
          clipPath: 'ellipse(68% 58% at 100% 0%)',
        }}
      />

      <Container className="relative z-10 max-w-[1406px]">
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

        <div className="mx-auto mt-8 grid max-w-5xl gap-px overflow-hidden rounded-[28px] border border-slate-200/90 bg-slate-200/80 shadow-[0_16px_38px_rgba(15,23,42,0.08)] md:grid-cols-2 lg:mt-10">
          <div className="bg-white px-5 py-5 sm:px-7 sm:py-6">
            <div
              className={cn(
                'flex items-center gap-4',
                isRTL && 'text-right md:flex-row-reverse'
              )}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <BadgePercent className="h-7 w-7" />
              </div>

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

          <div className="bg-white px-5 py-5 sm:px-7 sm:py-6">
            <div
              className={cn(
                'flex items-center gap-4',
                isRTL && 'text-right md:flex-row-reverse'
              )}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Headset className="h-7 w-7" />
              </div>

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
