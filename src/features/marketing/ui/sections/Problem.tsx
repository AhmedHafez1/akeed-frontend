'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
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

function Problem() {
  const t = useTranslations('problems')
  const { isRTL } = useLocaleInfo()

  return (
    <Section
      id="problem"
      className="relative px-4 sm:px-6 lg:px-10"
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

        {/* Problems Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:mb-12 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4"
        >
          {features.problems.map((problem) => (
            <motion.div key={problem.key} variants={item}>
               <div className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white px-4 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-md sm:px-6 sm:py-6 lg:min-h-72 lg:px-8">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-linear-to-br from-rose-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex flex-row items-start gap-3 sm:flex-col sm:items-center sm:gap-4">
                  {/* Icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-50 to-rose-100 text-4xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md sm:h-20 sm:w-20 sm:text-6xl lg:h-24 lg:w-24">
                    {problem.icon}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 space-y-1 sm:space-y-2 sm:text-center lg:space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    <h3 className="text-base font-bold text-slate-700 transition-colors group-hover:text-rose-700 sm:text-lg lg:text-xl">
                      {t(`${problem.key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {t(`${problem.key}.description`)}
                    </p>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-rose-100/30 blur-2xl transition-opacity group-hover:opacity-60" />
              </div>
            </motion.div>
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
