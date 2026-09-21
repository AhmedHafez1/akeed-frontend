import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleStop,
  Info,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type ImportNoticeTone =
  | 'info'
  | 'success'
  | 'warning'
  | 'critical'
  | 'safe'
  | 'neutral'

const toneClasses: Record<ImportNoticeTone, string> = {
  info: 'border-info-border bg-info-subtle text-info-subtle-foreground',
  success:
    'border-success-border bg-success-subtle text-success-subtle-foreground',
  warning:
    'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
  critical:
    'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
  safe: 'border-primary-border bg-primary-subtle text-primary-subtle-foreground',
  neutral: 'border-border bg-muted text-foreground',
}

const toneIcons: Record<ImportNoticeTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
  safe: ShieldCheck,
  neutral: CircleStop,
}

interface ImportNoticeProps {
  tone: ImportNoticeTone
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  /** `alert` for refusals that need attention now; `status` otherwise. */
  role?: 'alert' | 'status'
  className?: string
}

/** A tinted banner whose icon and text carry the meaning, not the colour. */
export function ImportNotice({
  tone,
  title,
  children,
  actions,
  role,
  className,
}: ImportNoticeProps) {
  const Icon = toneIcons[tone]
  return (
    <div
      role={role}
      className={cn(
        'rounded-card flex flex-col gap-3 border p-4 text-start sm:flex-row sm:items-start',
        toneClasses[tone],
        className
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1 text-sm leading-6">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
