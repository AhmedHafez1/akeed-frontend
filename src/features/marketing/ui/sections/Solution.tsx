'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { motion } from 'framer-motion'
import { features } from '@/features/marketing/config/site'
import ScrollDownArrow from './ScrollDownArrow'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

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

export function Solution() {
  const t = useTranslations('solution')
  const { isRTL } = useLocaleInfo()

  return (
    <Section
      id="solution"
      variant="gradient"
      className="relative px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48"
    >
      <Container>
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10 lg:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-3 text-2xl leading-tight font-black text-slate-700 sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-base font-medium text-slate-600 sm:mb-8 sm:text-lg md:text-xl lg:mb-12"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Solutions Grid (cards like Problem) */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:mb-12 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4"
        >
          {features.solutions.map((solution) => (
            <motion.div key={solution.key} variants={item}>
              <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white px-4 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:px-6 sm:py-6 lg:min-h-80 lg:px-8">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-linear-to-br from-emerald-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex flex-row items-start gap-3 sm:flex-col sm:items-center sm:gap-4">
                  {/* Icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 text-4xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md sm:h-20 sm:w-20 sm:text-6xl lg:h-24 lg:w-24">
                    {solution.icon}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 space-y-1 sm:space-y-2 sm:text-center lg:space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    <h3 className="text-base font-bold text-slate-700 transition-colors group-hover:text-emerald-600 sm:text-lg lg:text-xl">
                      {t(`${solution.key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {t(`${solution.key}.description`)}
                    </p>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl transition-opacity group-hover:opacity-60" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <ScrollDownArrow to="how-it-works" className="hidden sm:block" />
      </Container>
    </Section>
  )
}

export default Solution
