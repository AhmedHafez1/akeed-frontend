import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Clock3 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface AdminPageHeaderProps {
  eyebrow: string
  title: string
  description: string
  evaluatedAt?: string | null
  actions?: React.ReactNode
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  evaluatedAt,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-foreground/70 mt-2 text-sm leading-6">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {evaluatedAt && <AdminUpdatedTime value={evaluatedAt} />}
        {actions}
      </div>
    </header>
  )
}

export function AdminUpdatedTime({ value }: { value: string }) {
  const formatted = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

  return (
    <span
      className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
      title={formatted}
    >
      <Clock3 className="size-3.5" aria-hidden="true" />
      Last updated {formatted}
    </span>
  )
}

interface AdminSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  hideLabel?: boolean
}

export function AdminSelect({
  label,
  options,
  hideLabel = false,
  className,
  ...props
}: AdminSelectProps) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span
        className={cn(
          'text-foreground/70 mb-1.5 block text-xs font-medium',
          hideLabel && 'sr-only'
        )}
      >
        {label}
      </span>
      <span className="relative block">
        <select
          aria-label={hideLabel ? label : undefined}
          className="border-border bg-card text-foreground/80 hover:border-input focus:border-primary focus:ring-ring/15 h-10 w-full appearance-none rounded-lg border py-2 ps-3 pe-9 text-sm shadow-xs transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="text-muted-foreground/70 pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
      </span>
    </label>
  )
}

interface AdminMetricCardProps {
  label: string
  value: string | number
  detail?: string
  icon?: LucideIcon
  tone?: 'neutral' | 'emerald' | 'amber' | 'red' | 'blue'
  active?: boolean
  onClick?: () => void
}

const metricTones = {
  neutral: 'bg-muted text-foreground/70',
  emerald: 'bg-primary-subtle text-primary',
  amber: 'bg-warning-subtle text-warning',
  red: 'bg-destructive-subtle text-destructive-subtle-foreground',
  blue: 'bg-info-subtle text-info-subtle-foreground',
}

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'neutral',
  active = false,
  onClick,
}: AdminMetricCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        {Icon && (
          <span
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-lg',
              metricTones[tone]
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="text-foreground mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {detail && <p className="text-muted-foreground mt-1 text-xs">{detail}</p>}
    </>
  )
  const classes = cn(
    'relative rounded-xl border bg-card p-4 text-left shadow-xs transition-all',
    active ? 'border-primary ring-2 ring-ring/15' : 'border-border',
    onClick &&
      'cursor-pointer hover:-translate-y-0.5 hover:border-input hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none'
  )

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}

interface AdminEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="border-input bg-card rounded-2xl border border-dashed px-6 py-16 text-center shadow-xs">
      <span className="bg-muted text-muted-foreground mx-auto grid size-11 place-items-center rounded-xl">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-foreground mt-4 font-semibold">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
