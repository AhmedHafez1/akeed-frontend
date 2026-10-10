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
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { HeroFlowSteps } from '@/features/marketing/ui/components/hero/HeroFlowSteps'
import {
  DEFAULT_SIGNUP_SOURCE_ID,
  getStartRoutes,
} from '@/shared/config/commerceSources'
import { CREDIT_FREE_GRANT } from '@/shared/config/pricing'
import { formatCredits } from '@/shared/lib/money'
import Ecosystem from './Ecosystem'

const ChatInterface = dynamic(
  () =>
    import('@/features/marketing/ui/components/ChatInterface').then(
      (mod) => mod.ChatInterface
    ),
  { ssr: false }
)

/* en-GB joins the last item with "or" and no comma before it. */
const LIST_LOCALES = { ar: 'ar', en: 'en-GB' } as const

function Hero() {
  const t = useTranslations('hero')
  const tSources = useTranslations('sources')
  const { locale, targets } = useAcquisition()
  const shouldReduceMotion = useReducedMotion()

  // Named from the routes that are switched on, so a store Akeed cannot
  // connect yet is never promised here.
  const platforms = new Intl.ListFormat(LIST_LOCALES[locale], {
    style: 'long',
    type: 'disjunction',
  }).format(
    getStartRoutes()
      .filter((route) => route.id !== DEFAULT_SIGNUP_SOURCE_ID)
      .map((route) => tSources(`${route.id}.title`))
  )

  const microcopyItems = [
    {
      label: t('microcopy_credits', {
        count: formatCredits(CREDIT_FREE_GRANT, locale),
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
    <section className="relative overflow-hidden px-4 pt-28 pb-54 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36 rtl:pb-50">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-8">
          <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-start">
            {/* Headline */}
            <motion.h1
              {...fadeUp(0.08)}
              className="text-display text-foreground mb-6 text-balance lg:text-[3.5rem] lg:leading-[1.04] xl:text-[4.25rem] rtl:lg:text-[3.25rem] rtl:lg:leading-tight rtl:xl:text-[3.75rem]"
            >
              {/* Arabic runs longer, so only the LTR line is held to one row. */}
              <span className="block ltr:lg:whitespace-nowrap">
                {t('title')}
              </span>
              <span className="text-primary block">{t('highlight')}</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.16)}
              className="text-lead text-muted-foreground mb-8 max-w-2xl text-pretty"
            >
              {t('subtitle', { platforms })}
            </motion.p>

            {/* CTA row: one primary action, and the direct exit for Shopify. */}
            <motion.div
              {...fadeUp(0.24)}
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
              {...fadeUp(0.32)}
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

          {/* Product visual: flow steps beside the WhatsApp phone */}
          <motion.div
            {...fadeUp(0.3)}
            className="relative hidden items-center justify-end lg:flex"
          >
            <div
              aria-hidden
              className="bg-primary-subtle/80 pointer-events-none absolute end-0 top-1/2 h-120 w-120 -translate-y-1/2 rounded-full xl:-end-8"
            />
            <div className="relative z-10 me-5 xl:me-7">
              <HeroFlowSteps />
            </div>
            <div className="relative">
              <ChatInterface />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full">
        <Ecosystem />
      </div>
    </section>
  )
}

export default Hero
