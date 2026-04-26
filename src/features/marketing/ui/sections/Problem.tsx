'use client'

import { BarChart3, Clock3, MapPinned, Wallet } from 'lucide-react'
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

const problemCards = [
  { icon: Wallet, tone: 'emerald' },
  { icon: Clock3, tone: 'teal' },
  { icon: BarChart3, tone: 'cyan' },
  { icon: MapPinned, tone: 'sky' },
] as const

function Problem() {
  const t = useTranslations('problems')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="problem" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
        {/* Section Header */}
        <div className="landing-section-header mb-10 sm:mb-12 lg:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="landing-section-title max-w-5xl"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="landing-subtitle max-w-3xl"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Problems Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:mb-12 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4"
        >
          {features.problems.map((problem, index) => (
            <motion.article
              key={problem.key}
              variants={item}
              className={landingCardClass}
            >
              <div className={landingCardGlowClass} />

              <div className="relative mb-8 flex items-center justify-between">
                <LandingIconBadge
                  icon={problemCards[index % problemCards.length].icon}
                  tone={problemCards[index % problemCards.length].tone}
                  size="sm"
                />
                <span className="text-xs font-bold tracking-[0.12em] text-slate-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                <h3 className="my-4 text-lg font-bold text-slate-800">
                  {t(`${problem.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {t(`${problem.key}.description`)}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative mx-4 overflow-hidden sm:mx-6 lg:mx-8"
        >
          <div className="mb-4 space-y-4 text-center">
            <p className="text-base leading-relaxed text-slate-700 sm:text-lg md:text-xl">
              {t('reality')}
            </p>
            <p className="text-xl font-medium text-emerald-600 sm:text-2xl md:text-3xl">
              {t('reality_highlight')}
            </p>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

export default Problem
