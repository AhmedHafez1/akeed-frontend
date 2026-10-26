'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import type { AdminApiError } from './adminApi'
import type { TipEffectiveStatus } from './admin-tips.model'

const statusTones: Record<TipEffectiveStatus, string> = {
  draft: 'bg-muted text-foreground/70',
  published: 'bg-success-subtle text-success-subtle-foreground',
  paused: 'bg-warning-subtle text-warning-subtle-foreground',
  expired: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
}

export function TipStatusBadge({ status }: { status: TipEffectiveStatus }) {
  const t = useTranslations('adminTips.status')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        statusTones[status]
      )}
    >
      {t(status)}
    </span>
  )
}

/** The message for a failed request: by code, then by status. */
export function useTipsErrorMessage() {
  const t = useTranslations('adminTips.errors')
  return (error: AdminApiError): string => {
    if (error.code && t.has(error.code)) {
      const count = error.details?.recipient_count
      return t(error.code, { count: typeof count === 'number' ? count : 0 })
    }
    return error.status === 403 ? t('accessDenied') : t('requestFailed')
  }
}

export function TipsErrorNotice({
  error,
  onRetry,
  className,
}: {
  error: AdminApiError
  onRetry?: () => void
  className?: string
}) {
  const t = useTranslations('adminTips.errors')
  const tc = useTranslations('adminCommon')
  const message = useTipsErrorMessage()
  return (
    <div
      role="alert"
      className={cn(
        'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-xl border p-4 text-sm',
        className
      )}
    >
      <p>{message(error)}</p>
      {error.requestId && (
        <p className="mt-2 text-xs">
          <span>{t('requestIdLabel')} </span>
          <span className="font-mono" dir="ltr">
            {error.requestId}
          </span>
        </p>
      )}
      {onRetry && (
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          {tc('retry')}
        </Button>
      )}
    </div>
  )
}

/** Dates in the admin's own time zone, with the zone named. */
export function useTipsFormat() {
  const t = useTranslations('adminTips')
  const format = useFormatter()
  return {
    count: (value: number) => format.number(value),
    dateTime: (value: string | null) =>
      value === null
        ? t('none')
        : format.dateTime(new Date(value), {
            // dateStyle cannot be combined with timeZoneName.
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
  }
}

/** A field's finding, translated, under the field. */
export function TipFieldError({
  id,
  code,
}: {
  id: string
  code: string | undefined
}) {
  const t = useTranslations('adminTips.issues')
  if (!code) return null
  return (
    <p id={id} className="text-destructive mt-1 text-xs">
      {t.has(code) ? t(code) : t('invalid_value')}
    </p>
  )
}
