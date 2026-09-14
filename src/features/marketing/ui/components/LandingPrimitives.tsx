'use client'

import type { ComponentType, HTMLAttributes, ReactNode, SVGProps } from 'react'
import { cn } from '@/shared/lib/utils'

/* Hero only — the single brand-tinted surface on the page. */
export const landingSectionBackgroundClass = 'landing-hero-surface'

/*
 * Sections below the fold alternate plain white and the faint brand-tinted
 * canvas. Rhythm comes from that alternation plus a hairline, rather than
 * from repainting a grey gradient on every band.
 */
export const landingSectionChromeClass = 'border-border border-t bg-background'

export const landingSectionChromeAltClass = 'border-border border-t bg-canvas'

export const landingCardClass =
  'group rounded-card border-border bg-card shadow-card hover:border-primary-border hover:shadow-overlay relative overflow-hidden border p-8 transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1'

export const landingCardGlowClass =
  'bg-primary/20 absolute -right-10 -bottom-10 h-28 w-28 rounded-full opacity-50 blur-3xl transition-opacity group-hover:opacity-90'

export const landingInsetCardClass =
  'rounded-card border-border bg-card hover:border-primary-border hover:shadow-card border transition-[border-color,box-shadow] duration-300 ease-out'

/*
 * Same surface as the inset card, minus the hover response — for panels that
 * hold a statement rather than something to click. Reusing the inset card here
 * would light the border up under the cursor and promise an interaction that
 * does not exist.
 */
export const landingPanelClass = 'rounded-card border-border bg-card border'

const iconToneClasses = {
  emerald: 'bg-primary-subtle text-primary ring-primary-border ring-1',
  teal: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100',
  cyan: 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100',
  sky: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
  slate: 'bg-slate-50 text-slate-600 ring-1 ring-slate-100',
} as const

export type LandingIconTone = keyof typeof iconToneClasses

/*
 * Accent ramp for card grids, cycled by index so a row reads as a sequence
 * rather than repeating one accent six times. `slate` sits outside the ramp on
 * purpose — it stays the neutral choice for a lone, unsequenced badge.
 */
export const LANDING_CARD_TONES = ['emerald', 'teal', 'cyan', 'sky'] as const

type LandingIconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface LandingIconBadgeProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LandingIconComponent
  children?: ReactNode
  tone?: LandingIconTone
  size?: 'sm' | 'md'
}

export function LandingIconBadge({
  icon: Icon,
  children,
  tone = 'emerald',
  size = 'md',
  className,
  ...props
}: LandingIconBadgeProps) {
  const sizeClasses =
    size === 'sm'
      ? 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6'
      : 'h-16 w-16 [&_svg]:h-7 [&_svg]:w-7'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        iconToneClasses[tone],
        sizeClasses,
        className
      )}
      {...props}
    >
      {Icon ? <Icon /> : children}
    </div>
  )
}
