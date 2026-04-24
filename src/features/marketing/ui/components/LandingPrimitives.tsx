'use client'

import type { ComponentType, HTMLAttributes, ReactNode, SVGProps } from 'react'
import { cn } from '@/shared/lib/utils'

export const landingSectionBackgroundClass =
  'bg-linear-to-b from-gray-100 via-gray-200 to-gray-50'

export const landingSectionChromeClass =
  'border-t border-slate-200/70 bg-linear-to-b from-gray-100 via-gray-200 to-gray-50'

export const landingCardClass =
  'group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md'

export const landingCardGlowClass =
  'absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-emerald-200/30 opacity-50 blur-3xl transition-opacity group-hover:opacity-90'

export const landingInsetCardClass =
  'rounded-2xl border border-emerald-100 bg-white transition-all duration-300 hover:border-emerald-200 hover:shadow-md'

const iconToneClasses = {
  emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  teal: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100',
  cyan: 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100',
  sky: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
} as const

type LandingIconTone = keyof typeof iconToneClasses

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
      ? 'h-14 w-14 [&_svg]:h-6 [&_svg]:w-6'
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
