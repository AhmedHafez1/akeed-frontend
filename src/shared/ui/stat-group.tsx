import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface StatGroupItem {
  id: string
  label: ReactNode
  value: ReactNode
  caption?: ReactNode
}

interface StatGroupProps {
  items: readonly StatGroupItem[]
  className?: string
}

/**
 * A row of two to four headline numbers in one card, each a label, the
 * number and an optional caption. Stacks on phones, one row from 640px.
 */
export function StatGroup({ items, className }: StatGroupProps) {
  return (
    <dl
      className={cn(
        'rounded-ak-card border-line bg-card shadow-ak-card divide-line grid divide-y border sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0',
        className
      )}
    >
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1 p-5 text-start">
          <dt className="text-ink-muted text-sm">{item.label}</dt>
          <dd className="text-ink text-2xl font-bold tabular-nums">
            {item.value}
          </dd>
          {item.caption && (
            <dd className="text-ink-muted text-xs">{item.caption}</dd>
          )}
        </div>
      ))}
    </dl>
  )
}
