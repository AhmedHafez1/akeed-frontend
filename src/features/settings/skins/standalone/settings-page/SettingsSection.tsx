'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { AkSwitch, InfoHint, akCard } from '@/shared/ui'

/** Stacks annotated sections with a hairline between them. */
export function AnnotatedSections({ children }: { children: ReactNode }) {
  return (
    <div className="[&>*+*]:border-line flex flex-col gap-6 [&>*+*]:border-t [&>*+*]:pt-6">
      {children}
    </div>
  )
}

/**
 * A settings group: its title in a narrow start column, its card in the end
 * column. One column below 1100px. `description` is help behind an ⓘ, not
 * text on the page.
 */
export function AnnotatedSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="grid grid-cols-[minmax(0,1fr)] gap-3 min-[1100px]:grid-cols-[280px_minmax(0,1fr)] min-[1100px]:gap-8"
    >
      <div>
        <h2
          id={headingId}
          className="text-ak-section text-ink flex items-center gap-1"
        >
          {title}
          {description && <InfoHint label={title} content={description} />}
        </h2>
      </div>
      {/* min-w-0: a wide table scrolls inside the card, not the page. */}
      <div className={cn(akCard, 'min-w-0')}>{children}</div>
    </section>
  )
}

/** The name of one row of a settings card: 15px, between body and section. */
export const settingsRowTitle =
  'text-ink text-[0.9375rem] leading-6 font-semibold'

/** The padding every row of a settings card shares. */
export const settingsRowPadding = 'px-4 py-4 sm:px-6 sm:py-5'

/**
 * One on/off setting inside a card: its name at the start, the switch at the
 * end, and whatever the setting reveals (`children`) under them. `help` sits
 * behind an ⓘ; `note` stays visible and is only for what the merchant must
 * see now, such as why the switch is disabled. Settings in the same card are
 * separated by a hairline.
 */
export function SwitchSetting({
  title,
  help,
  note,
  checked,
  disabled,
  onCheckedChange,
  children,
}: {
  title: string
  help?: string
  note?: string
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
          <div className="flex items-center gap-1">
            <h3 id={titleId} className={settingsRowTitle}>
              {title}
            </h3>
            {help && <InfoHint label={title} content={help} />}
          </div>
          {note && (
            <p id={helpId} className="text-ak-caption text-ink-muted mt-0.5">
              {note}
            </p>
          )}
        </div>
        <AkSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-labelledby={titleId}
          aria-describedby={note ? helpId : undefined}
        />
      </div>
      {children}
    </div>
  )
}
