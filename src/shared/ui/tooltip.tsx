'use client'

import { useId, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  className?: string
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const tooltipId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') setIsOpen(false)
  }

  return (
    <span
      tabIndex={0}
      aria-describedby={isOpen ? tooltipId : undefined}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex rounded-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
    >
      {children}
      {isOpen && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute start-1/2 bottom-full z-50 mb-2 w-max max-w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs leading-5 font-medium text-white shadow-lg rtl:translate-x-1/2"
        >
          {content}
        </span>
      )}
    </span>
  )
}
