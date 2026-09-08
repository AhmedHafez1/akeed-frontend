import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  indicatorClassName?: string
}

export function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-stone-100',
        className
      )}
      {...props}
    >
      <div
        className={cn('h-full rounded-full bg-emerald-600 transition-all', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
