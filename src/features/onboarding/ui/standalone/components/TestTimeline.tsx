'use client'

import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type {
  TimelineRow,
  TimelineRowState,
} from '@/features/onboarding/model/onboardingTest'

interface TestTimelineProps {
  rows: ReadonlyArray<TimelineRow>
}

function Marker({
  state,
  isAction,
  index,
}: {
  state: TimelineRowState
  isAction: boolean
  index: number
}) {
  if (state === 'done') {
    return (
      <span className="bg-brand text-brand-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
        state === 'current'
          ? 'border-brand text-brand-ink'
          : 'border-border text-muted-foreground',
        state === 'current' && isAction && 'ring-brand/20 ring-4'
      )}
    >
      {index + 1}
    </span>
  )
}

/**
 * The live progress of the onboarding test, in Akeed's own brand tokens
 * (the standalone counterpart of the embedded `DeliveryStatusTimeline`).
 */
export function TestTimeline({ rows }: TestTimelineProps) {
  return (
    <ol className="flex flex-col gap-4" aria-live="polite">
      {rows.map((row, index) => {
        const isCurrentAction = row.isAction && row.state === 'current'
        return (
          <li
            key={row.id}
            aria-current={row.state === 'current' ? 'step' : undefined}
            className={cn(
              'flex items-center justify-between gap-3',
              isCurrentAction &&
                'border-brand-line bg-brand-soft rounded-panel border p-3'
            )}
          >
            <div className="flex items-center gap-3">
              <Marker
                state={row.state}
                isAction={!!row.isAction}
                index={index}
              />
              <div className="space-y-0.5">
                <p
                  className={cn(
                    isCurrentAction
                      ? 'text-brand-ink text-[17px] font-semibold'
                      : row.state === 'upcoming'
                        ? 'text-muted-foreground text-sm'
                        : 'text-foreground text-sm font-medium'
                  )}
                >
                  {row.label}
                </p>
                {row.note && (
                  <p className="text-muted-foreground text-xs">{row.note}</p>
                )}
              </div>
            </div>
            {row.timeLabel && (
              <span className="text-muted-foreground text-xs">
                {row.timeLabel}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
