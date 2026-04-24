'use client'

import { BotMessageSquare, PlugZap, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import {
  LandingIconBadge,
  landingCardClass,
  landingCardGlowClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
import { features } from '@/features/marketing/config/site'
import ScrollDownArrow from './ScrollDownArrow'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const stepCards = [
  { icon: PlugZap, tone: 'emerald' },
  { icon: BotMessageSquare, tone: 'teal' },
  { icon: Truck, tone: 'cyan' },
] as const

function HowItWorks() {
  const t = useTranslations('how_it_works')
  const { isRTL } = useLocaleInfo()

  return (
    <>
      <Section id="how-it-works" className="relative px-4 sm:px-6 lg:px-10">
        <Container>
          {/* Section Header */}
          <div className="landing-section-header mb-10 sm:mb-12 lg:mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="landing-section-title max-w-5xl"
            >
              {t('section_title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="landing-subtitle max-w-3xl"
            >
              {t('main_title')}
            </motion.p>
          </div>

          {/* Steps Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:gap-6 md:grid-cols-3 md:gap-8 lg:mb-12 lg:gap-16"
          >
            {features.howItWorks.map((step, index) => (
              <motion.article
                key={step.key}
                variants={item}
                className={landingCardClass}
              >
                <div className={landingCardGlowClass} />

                <div className="relative mb-6 flex items-center justify-between">
                  <LandingIconBadge
                    icon={stepCards[index % stepCards.length].icon}
                    tone={stepCards[index % stepCards.length].tone}
                    size="sm"
                  />
                  <span className="text-xs font-bold tracking-[0.12em] text-slate-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                  <h3 className="my-4 text-lg font-bold text-slate-800">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {t(`steps.${step.key}.description`)}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <ScrollDownArrow to="calculator" className="hidden sm:block" />
        </Container>
      </Section>
    </>
  )
}

export default HowItWorks
