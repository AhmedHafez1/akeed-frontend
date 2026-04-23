'use client'

import {
  BarChart3,
  BadgeCheck,
  Clock3,
  MessagesSquare,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'
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

const solutionCards = [
  {
    key: 'auto',
    icon: Settings2,
    iconTone: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'response',
    icon: MessagesSquare,
    iconTone: 'bg-teal-100 text-teal-700',
  },
  {
    key: 'location',
    icon: ShieldCheck,
    iconTone: 'bg-cyan-100 text-cyan-700',
  },
  {
    key: 'integration',
    icon: BadgeCheck,
    iconTone: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'natural',
    icon: Clock3,
    iconTone: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'analytics',
    icon: BarChart3,
    iconTone: 'bg-teal-100 text-teal-700',
  },
] as const

export function Solution() {
  const t = useTranslations('solution')

  return (
    <Section
      id="solution"
      variant="gradient"
      className="relative px-4 sm:px-6 lg:px-10"
    >
      <Container>
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
            className="mx-auto mb-6 max-w-3xl text-base font-medium text-slate-600 sm:mb-8 sm:text-lg md:text-xl lg:mb-12"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-2 sm:gap-5 lg:mb-12 lg:grid-cols-3 lg:gap-6"
        >
          {solutionCards.map((solution, index) => {
            const Icon = solution.icon

            return (
              <motion.article
                key={solution.key}
                variants={item}
                className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-emerald-200/30 opacity-50 blur-3xl transition-opacity group-hover:opacity-90" />

                <div className="relative mb-4 flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex h-11 w-11 items-center justify-center rounded-xl',
                      solution.iconTone
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold tracking-[0.12em] text-slate-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-bold text-slate-800">
                  {t(`${solution.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {t(`${solution.key}.description`)}
                </p>
              </motion.article>
            )
          })}
        </motion.div>

        <div className="mx-auto mb-8 grid max-w-5xl grid-cols-1 gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
            {t('location.title')}
          </div>
          <div className="rounded-xl bg-teal-50 px-4 py-3 text-center text-sm font-semibold text-teal-800">
            {t('integration.title')}
          </div>
          <div className="rounded-xl bg-cyan-50 px-4 py-3 text-center text-sm font-semibold text-cyan-800">
            {t('analytics.title')}
          </div>
        </div>

        <ScrollDownArrow to="how-it-works" className="hidden sm:block" />
      </Container>
    </Section>
  )
}

export default Solution
