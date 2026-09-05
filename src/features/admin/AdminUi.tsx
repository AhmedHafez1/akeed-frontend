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
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
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
      className="inline-flex items-center gap-1.5 text-xs text-slate-500"
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
          'mb-1.5 block text-xs font-medium text-slate-600',
          hideLabel && 'sr-only'
        )}
      >
        {label}
      </span>
      <span className="relative block">
        <select
          aria-label={hideLabel ? label : undefined}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 ps-3 pe-9 text-sm text-slate-700 shadow-xs transition-colors outline-none hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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
  neutral: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
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
        <p className="text-xs font-medium text-slate-500">{label}</p>
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
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </>
  )
  const classes = cn(
    'relative rounded-xl border bg-white p-4 text-left shadow-xs transition-all',
    active
      ? 'border-emerald-500 ring-2 ring-emerald-500/15'
      : 'border-slate-200',
    onClick &&
      'cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none'
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
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xs">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
