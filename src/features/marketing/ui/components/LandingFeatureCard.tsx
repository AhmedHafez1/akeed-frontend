'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  LandingIconBadge,
  type LandingIconTone,
  landingCardClass,
  landingCardGlowClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

/**
 * Parent variant for a grid of feature cards. Children inherit the `hidden`
 * /`show` state from it, so the grid only has to declare `whileInView`.
 */
export const landingCardGridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

interface LandingFeatureCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone?: LandingIconTone
  /**
   * Zero-based, rendered as a two-digit ordinal. Omit it unless the cards are
   * genuinely a sequence — a number on a set of unordered cards implies a
   * first step and a last one that the copy does not actually describe.
   */
  index?: number
  title: ReactNode
  description: ReactNode
  isRTL: boolean
}

/**
 * Icon + copy card on the elevated surface, shared by the Problem grid and the
 * HowItWorks step grid.
 *
 * Those two rendered the same markup from two copies, and both copies pinned
 * their text to `slate-800`/`slate-600` instead of the `foreground` /
 * `muted-foreground` tokens — so both stayed dark-on-light when the rest of
 * the page inverted under the dark theme. One component, token colours, and
 * the drift cannot reopen.
 */
export function LandingFeatureCard({
  icon,
  tone = 'emerald',
  index,
  title,
  description,
  isRTL,
}: LandingFeatureCardProps) {
  const shouldReduceMotion = useReducedMotion()

  const item = shouldReduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        },
      }

  return (
    <motion.article
      variants={item}
      className={cn(
        landingCardClass,
        'flex flex-col gap-4 p-6',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <div className={landingCardGlowClass} aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <LandingIconBadge icon={icon} tone={tone} size="sm" />
        {index === undefined ? null : (
          /* Decorative — the copy already carries the meaning. */
          <span
            aria-hidden
            dir="ltr"
            className="text-muted-foreground text-xs font-bold tracking-[0.12em]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="relative">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {description}
        </p>
      </div>
    </motion.article>
  )
}
