'use client'

import type { ReactNode } from 'react'
import { useId } from 'react'
import { OnboardingSwitch } from './OnboardingSwitch'

interface OnboardingCardProps {
  title: string
  description?: string
  checked?: boolean
  switchLabel?: string
  switchDisabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  children?: ReactNode
}

/**
 * Section card with an optional controlling switch in its header. The body is
 * separated by a rule so a disabled dependent field reads as belonging to the
 * switch above it.
 */
export function OnboardingCard({
  title,
  description,
  checked,
  switchLabel,
  switchDisabled = false,
  onCheckedChange,
  children,
}: OnboardingCardProps) {
  const descriptionId = useId()
  const hasSwitch =
    checked !== undefined && switchLabel !== undefined && !!onCheckedChange

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 p-4 text-start sm:p-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          {description && (
            <p id={descriptionId} className="text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {hasSwitch && (
          <OnboardingSwitch
            checked={checked}
            disabled={switchDisabled}
            label={switchLabel}
            describedBy={description ? descriptionId : undefined}
            onChange={onCheckedChange}
          />
        )}
      </div>
      {children && (
        <div className="border-t border-slate-200 p-4 text-start sm:p-5">
          {children}
        </div>
      )}
    </section>
  )
}
