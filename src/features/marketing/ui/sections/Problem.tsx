'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

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

const problemIconTones = [
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-sky-100 text-sky-700',
] as const

function Problem() {
  const t = useTranslations('problems')
  const { isRTL } = useLocaleInfo()

  return (
    <Section id="problem" className="relative px-4 sm:px-6 lg:px-10">
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
              className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-emerald-200/30 opacity-50 blur-3xl transition-opacity group-hover:opacity-90" />

              <div className="relative mb-4 flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl',
                    problemIconTones[index % problemIconTones.length]
                  )}
                >
                  {problem.icon}
                </span>
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

        {/* Reality Check Card - More Prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative mx-4 overflow-hidden sm:mx-6 lg:mx-8"
        >
          <div className="space-y-2 text-center sm:space-y-3">
            <p className="text-base leading-relaxed text-slate-700 sm:text-lg md:text-xl">
              {t('reality')}
            </p>
            <p className="text-xl font-black text-emerald-600 sm:text-2xl md:text-3xl">
              {t('reality_highlight')}
            </p>
          </div>
        </motion.div>
        {/* Scroll Indicator */}
        <ScrollDownArrow to="solution" className="hidden sm:block" />
      </Container>
    </Section>
  )
}

export default Problem
