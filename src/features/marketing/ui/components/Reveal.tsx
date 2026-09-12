'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  /** Stagger a section slightly behind the one above it. */
  delay?: number
  className?: string
}

/**
 * Scroll-triggered entrance for marketing sections.
 *
 * `framer-motion` was already a dependency but was only driving the hero's
 * entrance, so everything below the fold arrived with no transition at all.
 *
 * Honours `prefers-reduced-motion` the same way `Hero.tsx` does — the
 * content still renders, it simply arrives without movement. `once: true`
 * keeps sections from re-animating on every scroll pass, which reads as
 * nervous rather than polished.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -10% 0px' }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.6,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
