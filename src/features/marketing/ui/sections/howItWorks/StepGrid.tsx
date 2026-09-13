'use client'

import { motion } from 'framer-motion'
import type { HowItWorksStep } from '@/features/marketing/config/site'
import {
  LandingIconBadge,
  landingCardClass,
  landingCardGlowClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

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

const TONES = ['emerald', 'teal', 'cyan', 'sky'] as const

interface StepGridProps {
  steps: HowItWorksStep[]
  isRTL: boolean
  t: (key: string) => string
}

export function StepGrid({ steps, isRTL, t }: StepGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        'grid grid-cols-1 gap-4 sm:gap-6 md:gap-8',
        steps.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'
      )}
    >
      {steps.map((step, index) => (
        <motion.article
          key={step.key}
          variants={item}
          className={landingCardClass}
        >
          <div className={landingCardGlowClass} />

          <div className="relative mb-6 flex items-center justify-between">
            <LandingIconBadge
              icon={step.icon}
              tone={TONES[index % TONES.length]}
              size="sm"
            />
            <span className="text-muted-foreground text-xs font-bold tracking-[0.12em]">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <div className={cn(isRTL ? 'text-right' : 'text-left')}>
            <h3 className="my-4 text-lg font-bold text-slate-800">
              {t(`${step.key}.title`)}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              {t(`${step.key}.description`)}
            </p>
          </div>
        </motion.article>
      ))}
    </motion.div>
  )
}
