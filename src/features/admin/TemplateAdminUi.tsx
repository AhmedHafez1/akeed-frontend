'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { Badge, Button, Input, Label } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { AdminApiError } from './adminApi'
import {
  driftTone,
  qualityTone,
  reviewStatusTone,
  templateStatusKey,
  type TemplateCategory,
  type TemplateDriftSummary,
  type TemplateQuality,
  type TemplateRange,
  type TemplateReviewStatus,
  type TemplateSummary,
} from './admin-templates.model'

type Translate = ReturnType<typeof useTranslations>

/** A coded label, or the raw code when a newer backend sends an unknown one. */
function coded(t: Translate, group: string, code: string): string {
  const key = `${group}.${code}`
  return t.has(key) ? t(key) : code
}

export function TemplateStatusBadge({
  status,
}: {
  status: TemplateReviewStatus | null
}) {
  const t = useTranslations('adminTemplates')
  return (
    <Badge variant={reviewStatusTone(status)}>
      {coded(t, 'status', templateStatusKey(status))}
    </Badge>
  )
}

export function TemplateQualityBadge({
  quality,
}: {
  quality: TemplateQuality | null
}) {
  const t = useTranslations('adminTemplates')
  if (quality === null)
    return <span className="text-muted-foreground">{t('none')}</span>
  return (
    <Badge variant={qualityTone(quality)}>{coded(t, 'quality', quality)}</Badge>
  )
}

export function TemplateCategoryLabel({
  category,
  pending,
}: {
  category: TemplateCategory | null
  pending: TemplateCategory | null
}) {
  const t = useTranslations('adminTemplates')
  if (category === null)
    return <span className="text-muted-foreground">{t('none')}</span>
  return (
    <div>
      <span>{coded(t, 'category', category)}</span>
      {pending && (
        <p className="text-warning-subtle-foreground mt-1 text-xs font-medium">
          {t('pendingCategory', { category: coded(t, 'category', pending) })}
        </p>
      )}
    </div>
  )
}

export function TemplateDriftBadge({ drift }: { drift: TemplateDriftSummary }) {
  const t = useTranslations('adminTemplates')
  return (
    <Badge variant={driftTone(drift)}>
      {coded(t, 'drift.state', drift.state)}
    </Badge>
  )
}

/** Active, default and "cannot be sent" flags next to a template's name. */
export function TemplateFlags({ template }: { template: TemplateSummary }) {
  const t = useTranslations('adminTemplates')
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      <Badge variant={template.is_active ? 'outline' : 'secondary'}>
        {template.is_active ? t('flags.active') : t('flags.inactive')}
      </Badge>
      {template.is_default && (
        <Badge variant="info">{t('flags.default')}</Badge>
      )}
      {template.is_active && !template.sendable && (
        <Badge variant="danger">{t('flags.notSendable')}</Badge>
      )}
    </div>
  )
}

interface TemplateRangeFieldsProps {
  range: TemplateRange
  valid: boolean
  disabled?: boolean
  onChange: (range: TemplateRange) => void
}

export function TemplateRangeFields({
  range,
  valid,
  disabled,
  onChange,
}: TemplateRangeFieldsProps) {
  const t = useTranslations('adminTemplates')
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{t('range.label')}</legend>
      <div className="flex flex-wrap items-end gap-3">
        {(['from', 'to'] as const).map((end) => (
          <div key={end} className="min-w-0">
            <Label
              htmlFor={`template-range-${end}`}
              className="text-foreground/70 mb-1.5 block text-xs font-medium"
            >
              {t(`range.${end}`)}
            </Label>
            <Input
              id={`template-range-${end}`}
              type="date"
              dir="ltr"
              className="h-10 w-40"
              value={range[end]}
              disabled={disabled}
              aria-invalid={!valid}
              onChange={(event) =>
                onChange({ ...range, [end]: event.target.value })
              }
            />
          </div>
        ))}
      </div>
      <p
        className={cn(
          'mt-1.5 text-xs',
          valid ? 'text-muted-foreground' : 'text-destructive'
        )}
        role={valid ? undefined : 'alert'}
      >
        {valid ? t('range.hint') : t('range.invalid')}
      </p>
    </fieldset>
  )
}

/** The message for a failed admin request: by code, then by status. */
export function useTemplateErrorMessage() {
  const t = useTranslations('adminTemplates')
  return (error: AdminApiError): string => {
    if (error.code && t.has(`errors.${error.code}`))
      return t(`errors.${error.code}`)
    return error.status === 403
      ? t('errors.accessDenied')
      : t('errors.requestFailed')
  }
}

interface TemplateErrorNoticeProps {
  error: AdminApiError
  onRetry?: () => void
  className?: string
}

export function TemplateErrorNotice({
  error,
  onRetry,
  className,
}: TemplateErrorNoticeProps) {
  const t = useTranslations('adminTemplates')
  const tc = useTranslations('adminCommon')
  const message = useTemplateErrorMessage()
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
          <span>{t('errors.requestIdLabel')} </span>
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

/** Locale-aware formatting for the template pages; dates are shown in UTC. */
export function useTemplateFormat() {
  const t = useTranslations('adminTemplates')
  const format = useFormatter()
  return {
    count: (value: number) => format.number(value),
    rate: (value: number | null) =>
      value === null
        ? t('none')
        : format.number(value, { style: 'percent', maximumFractionDigits: 1 }),
    dateTime: (value: string | null) =>
      value === null
        ? t('never')
        : format.dateTime(new Date(value), {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
          }),
    label: (group: string, code: string) => coded(t, group, code),
  }
}
