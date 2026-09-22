import type { ReactNode } from 'react'

interface WizardFooterProps {
  /** Secondary actions, at the inline start. */
  secondary?: ReactNode
  /**
   * The primary action, at the inline end (left in Arabic, right in English).
   * Viewers get none.
   */
  primary?: ReactNode
  /** One line under the primary action on phones. */
  note?: ReactNode
}

/**
 * The step's actions. Below the tablet breakpoint it sticks to the bottom
 * of the screen so the primary action stays in reach (story AC12).
 */
export function WizardFooter({ secondary, primary, note }: WizardFooterProps) {
  return (
    <div className="border-border bg-card shadow-sticky md:rounded-card fixed inset-x-0 bottom-0 z-30 border-t p-4 md:static md:z-auto md:border md:shadow-none">
      <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">{secondary}</div>
        <div className="flex flex-col gap-1.5 md:items-end">
          {primary}
          {note && (
            <p className="text-muted-foreground text-center text-xs md:text-end">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
