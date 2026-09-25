import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * A step inside the import modal: a scrolling body and, when the step has
 * actions, a footer pinned under it (the dialog's sticky footer).
 */
export function ModalStepLayout({
  children,
  footer,
  bodyClassName,
}: {
  children: ReactNode
  footer?: ReactNode
  bodyClassName?: string
}) {
  return (
    <>
      <div
        className={cn(
          'min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6',
          bodyClassName
        )}
      >
        {children}
      </div>
      {footer && (
        <footer className="border-border bg-muted/40 shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4">
          {footer}
        </footer>
      )}
    </>
  )
}
