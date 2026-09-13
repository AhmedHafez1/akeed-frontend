'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import {
  ACQUISITION_PATHS,
  type AcquisitionPath,
} from '@/features/marketing/domain/acquisitionPaths'
import { cn } from '@/shared/lib/utils'

interface PathTabsProps {
  value: AcquisitionPath
  labels: Record<AcquisitionPath, string>
  ariaLabel: string
  onChange: (path: AcquisitionPath) => void
}

export function PathTabs({
  value,
  labels,
  ariaLabel,
  onChange,
}: PathTabsProps) {
  const shouldReduceMotion = useReducedMotion()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

    event.preventDefault()
    const currentIndex = ACQUISITION_PATHS.indexOf(value)
    // Arrow keys follow the visual order, which `dir` already mirrors, so the
    // step direction is the same expression in both text directions.
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex =
      (currentIndex + delta + ACQUISITION_PATHS.length) %
      ACQUISITION_PATHS.length
    const next = ACQUISITION_PATHS[nextIndex]

    onChange(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="bg-canvas ring-border inline-flex gap-1 rounded-full p-1 ring-1"
    >
      {ACQUISITION_PATHS.map((path) => {
        const isSelected = path === value

        return (
          <button
            key={path}
            ref={(node) => {
              tabRefs.current[path] = node
            }}
            type="button"
            role="tab"
            id={`how-it-works-tab-${path}`}
            aria-selected={isSelected}
            aria-controls={`how-it-works-panel-${path}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(path)}
            onKeyDown={handleKeyDown}
            className={cn(
              'focus-visible:ring-ring relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isSelected && (
              /*
               * `layoutId` measures the real boxes, so the indicator lands
               * correctly under both `dir=ltr` and `dir=rtl`. A translateX
               * thumb would need its sign flipped for RTL.
               */
              <motion.span
                layoutId="how-it-works-tab-indicator"
                className="bg-primary absolute inset-0 rounded-full"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 32 }
                }
              />
            )}
            <span className="relative z-10">{labels[path]}</span>
          </button>
        )
      })}
    </div>
  )
}
