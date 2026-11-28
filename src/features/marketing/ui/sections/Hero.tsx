'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { ConfirmedOrdersCounter } from '@/features/marketing/ui/components/hero/ConfirmedOrdersCounter'
import { HeroPhoneMockup } from '@/features/marketing/ui/components/hero/HeroPhoneMockup'
import { CREDIT_FREE_MESSAGES } from '@/shared/config/pricing'
import { formatCredits } from '@/shared/lib/money'
import Ecosystem from './Ecosystem'

interface HeroProps {
  /** Null when the backend could not answer: the counter is then left out. */
  confirmedOrdersTotal?: number | null
  /** Null when the stores could not be counted: only orders then show. */
  activeStoresTotal?: number | null
}

function Hero({
  confirmedOrdersTotal = null,
  activeStoresTotal = null,
}: HeroProps) {
  const t = useTranslations('hero')
  const { locale, targets } = useAcquisition()
  const shouldReduceMotion = useReducedMotion()

  const microcopyItems = [
    {
      label: t('microcopy_credits', {
        count: formatCredits(CREDIT_FREE_MESSAGES, locale),
      }),
      icon: CheckCircle2,
    },
    { label: t('microcopy_no_card'), icon: CreditCard },
    { label: t('microcopy_official'), icon: ShieldCheck },
  ] as const

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.6,
      delay: shouldReduceMotion ? 0 : delay,
    },
  })

  return (
    <section className="relative overflow-hidden px-4 pt-24 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36">
      <div className="mx-auto w-full max-w-7xl">
        {/* Mobile reads headline, phone, then CTAs; desktop puts the phone in its own column. */}
        <div className="grid items-center gap-y-6 sm:gap-y-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-x-8">
          <div className="flex w-full flex-col items-center text-center lg:col-start-1 lg:row-start-1 lg:items-start lg:self-end lg:text-start">
            <motion.h1
              {...fadeUp(0.08)}
              className="text-display text-foreground mb-5 text-balance sm:mb-6 lg:text-[3.5rem] lg:leading-[1.04] xl:text-[4.25rem] rtl:lg:text-[3.25rem] rtl:lg:leading-tight rtl:xl:text-[3.75rem]"
            >
              {/* Arabic runs longer, so only the LTR line is held to one row. */}
              <span className="block ltr:lg:whitespace-nowrap">
                {t('title')}
              </span>
              <span className="text-primary block">{t('highlight')}</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.16)}
              className="text-lead text-muted-foreground max-w-xl text-pretty"
            >
              {t('subtitle')}
            </motion.p>
          </div>

          <motion.div
            {...fadeUp(0.24)}
            className="relative flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end"
          >
            <div className="relative w-full max-w-70 lg:me-8 xl:me-16">
              <div
                aria-hidden
                className="bg-primary-subtle/80 pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-96 sm:w-96 lg:h-120 lg:w-120"
              />
              <HeroPhoneMockup className="relative" />
            </div>
          </motion.div>

          <div className="flex w-full flex-col items-center lg:col-start-1 lg:row-start-2 lg:items-start lg:self-start">
            {/* CTA row: one primary action, and the direct exit for Shopify. */}
            <motion.div
              {...fadeUp(0.32)}
              className="mb-5 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center lg:justify-start"
            >
              <AcquisitionCta
                target={targets.standalone}
                label={t('cta_primary')}
                variant="primary"
                className="h-14 gap-3 px-8 text-lg font-semibold"
                trailing={
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                }
              />
              <AcquisitionCta
                target={targets.shopify}
                label={t('cta_shopify')}
                variant="secondary"
                className="h-14 gap-2.5 px-6 text-base font-semibold"
                leading={
                  <Image
                    src="/images/landing/logos/shopify_icon_1.png"
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                    className="h-6 w-6 object-contain"
                  />
                }
                trailing={
                  <ExternalLink
                    aria-hidden="true"
                    className="text-muted-foreground h-4 w-4"
                  />
                }
              />
            </motion.div>

            {/* Microcopy */}
            <motion.ul
              {...fadeUp(0.4)}
              className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm lg:justify-start"
            >
              {microcopyItems.map(({ label, icon: Icon }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </li>
              ))}
            </motion.ul>
          </div>
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center sm:mt-16 lg:mt-20">
        {confirmedOrdersTotal !== null && (
          <ConfirmedOrdersCounter
            total={confirmedOrdersTotal}
            stores={activeStoresTotal}
          />
        )}
        <Ecosystem />
      </div>
    </section>
  )
}

export default Hero
