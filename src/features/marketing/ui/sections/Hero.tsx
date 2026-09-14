'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle2, CirclePlay, CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import type { MouseEvent } from 'react'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { HeroFlowSteps } from '@/features/marketing/ui/components/hero/HeroFlowSteps'
import { HeroValueProps } from '@/features/marketing/ui/components/hero/HeroValueProps'
import { scrollToElement } from '@/shared/lib/scroll'
import Ecosystem from './Ecosystem'

const ChatInterface = dynamic(
  () =>
    import('@/features/marketing/ui/components/ChatInterface').then(
      (mod) => mod.ChatInterface
    ),
  { ssr: false }
)

const HOW_IT_WORKS_ID = 'how-it-works'

function Hero() {
  const t = useTranslations('hero')
  const { targets } = useAcquisition()
  const shouldReduceMotion = useReducedMotion()

  const microcopyItems = [
    { label: t('microcopy_credits'), icon: CheckCircle2 },
    { label: t('microcopy_no_card'), icon: CreditCard },
  ] as const

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.6,
      delay: shouldReduceMotion ? 0 : delay,
    },
  })

  const handleSeeHowItWorks = (event: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToElement(HOW_IT_WORKS_ID)) {
      event.preventDefault()
    }
  }

  return (
    <section className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:px-10 lg:pt-36 lg:pb-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-8">
          <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-start">
            {/* Headline */}
            <motion.h1
              {...fadeUp(0.08)}
              className="text-display text-foreground mb-13 text-balance lg:text-[3.5rem] lg:leading-[1.04] xl:text-[4.25rem] rtl:lg:text-[3.25rem] rtl:lg:leading-tight rtl:xl:text-[3.75rem]"
            >
              {/* Arabic runs longer, so only the LTR line is held to one row. */}
              <span className="block ltr:lg:whitespace-nowrap">
                {t('title')}
              </span>
              <span className="text-primary block">{t('highlight')}</span>
            </motion.h1>

            {/* CTA row */}
            <motion.div
              {...fadeUp(0.24)}
              className="mb-4 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center lg:justify-start"
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
              <a
                href={`#${HOW_IT_WORKS_ID}`}
                onClick={handleSeeHowItWorks}
                className="group rounded-control bg-card/90 text-foreground shadow-card ring-border hover:ring-primary-border hover:text-primary focus-visible:ring-ring inline-flex h-14 items-center justify-center gap-2.5 px-7 text-base font-semibold ring-1 transition-[box-shadow,color,transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none"
              >
                <CirclePlay className="text-primary h-5 w-5" />
                {t('cta_secondary')}
              </a>
            </motion.div>

            {/* Microcopy */}
            <motion.ul
              {...fadeUp(0.32)}
              className="text-muted-foreground mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-light lg:justify-start"
            >
              {microcopyItems.map(({ label, icon: Icon }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </li>
              ))}
            </motion.ul>

            {/* Value props */}
            <motion.div {...fadeUp(0.4)} className="w-full">
              <HeroValueProps />
            </motion.div>
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

      <Ecosystem />
    </section>
  )
}

export default Hero
