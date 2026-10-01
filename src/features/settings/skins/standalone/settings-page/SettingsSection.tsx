'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { AkSwitch, akCard } from '@/shared/ui'

/** Stacks annotated sections with a hairline between them. */
export function AnnotatedSections({ children }: { children: ReactNode }) {
  return (
    <div className="[&>*+*]:border-line flex flex-col gap-6 [&>*+*]:border-t [&>*+*]:pt-6">
      {children}
    </div>
  )
}

/**
 * A settings group: what it is about in a narrow start column, its card in
 * the end column. One column below 1100px.
 */
export function AnnotatedSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-3 min-[1100px]:grid-cols-[280px_minmax(0,1fr)] min-[1100px]:gap-8"
    >
      <div>
        <h2 id={headingId} className="text-ak-section text-ink">
          {title}
        </h2>
        <p className="text-ak-caption text-ink-muted mt-0.5">{description}</p>
      </div>
      <div className={akCard}>{children}</div>
    </section>
  )
}

/** The padding every row of a settings card shares. */
export const settingsRowPadding = 'px-4 py-4 sm:px-6 sm:py-5'

/**
 * One on/off setting inside a card: its name and what it does at the start,
 * the switch at the end, and whatever the setting reveals (`children`) under
 * them. Settings in the same card are separated by a hairline.
 */
export function SwitchSetting({
  title,
  help,
  checked,
  disabled,
  onCheckedChange,
  children,
}: {
  title: string
  help: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
  children?: ReactNode
}) {
  const titleId = useId()
  const helpId = useId()
  return (
    <div className="border-line border-t first:border-t-0">
      <div
        className={cn(
          'flex items-start justify-between gap-4',
          settingsRowPadding
        )}
      >
        <div className="min-w-0">
          <h3 id={titleId} className="text-ak-body text-ink font-semibold">
            {title}
          </h3>
          <p id={helpId} className="text-ak-caption text-ink-muted mt-0.5">
            {help}
          </p>
        </div>
        <AkSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-labelledby={titleId}
          aria-describedby={helpId}
        />
      </div>
      {children}
    </div>
  )
}
