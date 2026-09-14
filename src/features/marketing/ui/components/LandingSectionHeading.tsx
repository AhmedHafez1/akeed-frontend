'use client'

import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface LandingSectionHeadingProps {
  /** Small brand-tinted kicker above the title. */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  isRTL: boolean
  className?: string
}

/**
 * The one heading block every marketing section below the hero renders.
 *
 * The page previously carried two incompatible header patterns: a centred
 * `.landing-section-header` stack (Problem, HowItWorks, FAQ) and a
 * start-aligned one written inline (Trust, WhoItsFor, Pricing). Reading down
 * the page, the title alignment flipped four times. Pricing had also drifted
 * off the type scale entirely — a literal `text-3xl sm:text-4xl` where every
 * other section used `text-h1`.
 *
 * Encoding it once means a section can no longer drift on its own. Alignment
 * follows the reading direction rather than being centred, because these
 * headers sit above start-aligned card grids and a centred title over a
 * left-aligned grid reads as an accident. `FinalCta` stays centred on purpose
 * — it is a standalone closing panel with no grid under it.
 */
export function LandingSectionHeading({
  eyebrow,
  title,
  description,
  isRTL,
  className,
}: LandingSectionHeadingProps) {
  return (
    <div className={cn('mb-10', isRTL ? 'text-right' : 'text-left', className)}>
      {eyebrow ? (
        <p className="text-primary mb-3 text-sm font-semibold">{eyebrow}</p>
      ) : null}

      <h2 className="text-h1 text-foreground max-w-5xl text-balance">
        {title}
      </h2>

      {description ? (
        <p className="text-lead text-muted-foreground mt-4 max-w-3xl text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  )
}
