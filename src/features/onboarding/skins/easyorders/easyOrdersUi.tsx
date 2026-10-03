import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { akCard } from '@/shared/ui'

/** The narrow column every EasyOrders connection screen sits in. */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-12">
      {children}
    </div>
  )
}

type Tone = 'brand' | 'muted' | 'destructive'

const ICON_TONES: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-ink',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
}

export function Panel({
  icon,
  tone,
  children,
}: {
  icon: ReactNode
  tone: Tone
  children: ReactNode
}) {
  return (
    <section className={cn(akCard, 'space-y-4 p-6 text-start sm:p-8')}>
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-full [&_svg]:size-6',
          ICON_TONES[tone]
        )}
      >
        {icon}
      </span>
      {children}
    </section>
  )
}

const NOTICE_TONES = {
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  destructive:
    'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
} as const

export function Notice({
  tone,
  icon,
  role = 'alert',
  children,
}: {
  tone: keyof typeof NOTICE_TONES
  icon: ReactNode
  role?: 'alert' | 'status'
  children: ReactNode
}) {
  return (
    <div
      role={role}
      className={cn(
        'rounded-panel flex items-start gap-2 border p-3 text-start text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0',
        NOTICE_TONES[tone]
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}
