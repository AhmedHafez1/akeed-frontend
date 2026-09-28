import type { ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  Send,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { RowStatusKind } from '@/features/dashboard/domain/confirmationRowStatus'

const STYLES: Record<RowStatusKind, { className: string; Icon: LucideIcon }> = {
  pending: { className: 'bg-ak-info-soft text-ak-info', Icon: Send },
  needsAction: {
    className: 'bg-ak-warning-soft text-ak-warning',
    Icon: AlertCircle,
  },
  confirmed: { className: 'bg-brand-soft text-brand-ink', Icon: Check },
  canceled: { className: 'bg-ak-danger-soft text-ak-danger', Icon: X },
  failed: {
    className: 'bg-ak-danger-soft text-ak-danger',
    Icon: AlertTriangle,
  },
  scheduled: { className: 'bg-neutral-soft text-ink-muted', Icon: Clock },
}

/**
 * The one status pill for the standalone pages: always an icon and a word,
 * so no status is told apart by colour alone. 24px high, fully rounded.
 */
export function StatusBadge({
  kind,
  children,
  icon,
  className,
  title,
  size = 'sm',
}: {
  kind: RowStatusKind
  children: ReactNode
  /** Overrides the kind's icon, e.g. a clock on a "no reply" age. */
  icon?: LucideIcon
  className?: string
  title?: string
  /** `sm` is the 24px table badge; `md` the 32px legend chip. */
  size?: 'sm' | 'md'
}) {
  const { className: tone, Icon } = STYLES[kind]
  const Glyph = icon ?? Icon
  return (
    <span
      title={title}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded-full whitespace-nowrap',
        size === 'sm'
          ? 'text-ak-label h-6 gap-1 px-2.5'
          : 'text-ak-caption h-8 gap-1.5 px-3 font-medium',
        tone,
        className
      )}
    >
      <Glyph
        aria-hidden="true"
        strokeWidth={2.25}
        className={cn('shrink-0', size === 'sm' ? 'size-3' : 'size-3.5')}
      />
      <span className="truncate">{children}</span>
    </span>
  )
}
