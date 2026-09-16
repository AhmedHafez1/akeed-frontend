'use client'

import { motion } from 'framer-motion'
import type { HowItWorksStep } from '@/features/marketing/config/site'
import {
  LandingFeatureCard,
  landingCardGridVariants,
} from '@/features/marketing/ui/components/LandingFeatureCard'
import { LANDING_CARD_TONES } from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

interface StepGridProps {
  steps: HowItWorksStep[]
  isRTL: boolean
  t: (key: string) => string
}

export function StepGrid({ steps, isRTL, t }: StepGridProps) {
  return (
    /*
     * `whileInView`, not `animate`: the section sits well below the fold, so an
     * on-mount animation had always finished before the visitor scrolled to it.
     * The grid is remounted on every tab change (keyed by path in the parent),
     * and the replacement is on screen at that point, so switching tabs still
     * plays the stagger.
     */
    <motion.div
      variants={landingCardGridVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      className={cn(
        'grid grid-cols-1 gap-4 lg:gap-6',
        steps.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
      )}
    >
      {steps.map((step, index) => (
        <LandingFeatureCard
          key={step.key}
          icon={step.icon}
          tone={LANDING_CARD_TONES[index % LANDING_CARD_TONES.length]}
          index={index}
          title={t(`${step.key}.title`)}
          description={t(`${step.key}.description`)}
          isRTL={isRTL}
        />
      ))}
    </motion.div>
  )
}
