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
import {
  LandingIconBadge,
  landingCardClass,
  landingCardGlowClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'

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
    key: 'response',
    icon: MessagesSquare,
    iconTone: 'teal',
  },
  {
    key: 'location',
    icon: ShieldCheck,
    iconTone: 'cyan',
  },
  {
    key: 'integration',
    icon: BadgeCheck,
    iconTone: 'sky',
  },
  {
    key: 'natural',
    icon: Clock3,
    iconTone: 'emerald',
  },
  {
    key: 'analytics',
    icon: BarChart3,
    iconTone: 'teal',
  },
  {
    key: 'auto',
    icon: Settings2,
    iconTone: 'emerald',
  },
] as const

export function Solution() {
  const t = useTranslations('solution')

  return (
    <Section id="solution" className="relative px-4 sm:px-6 lg:px-10">
      <Container className="relative z-10 max-w-351.5">
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
                className={landingCardClass}
              >
                <div className={landingCardGlowClass} />

                <div className="relative mb-8 flex items-center justify-between">
                  <LandingIconBadge
                    icon={Icon}
                    tone={solution.iconTone}
                    size="sm"
                  />
                  <span className="text-xs font-bold tracking-[0.12em] text-slate-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="my-4 text-lg font-bold text-slate-800">
                  {t(`${solution.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {t(`${solution.key}.description`)}
                </p>
              </motion.article>
            )
          })}
        </motion.div>
      </Container>
    </Section>
  )
}

export default Solution
