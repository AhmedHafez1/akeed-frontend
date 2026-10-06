'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import type {
  TemplateAuthoringContext,
  TemplateDraftIssue,
} from './admin-template-drafts.model'

export const templateFieldClass =
  'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60'

export function TemplateNotice({
  tone,
  title,
  children,
}: {
  tone: 'danger' | 'warning' | 'info' | 'success'
  title: string
  children?: ReactNode
}) {
  const Icon = tone === 'info' || tone === 'success' ? Info : AlertTriangle
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl border p-4 text-sm',
        tone === 'danger' &&
          'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
        tone === 'warning' &&
          'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        tone === 'info' &&
          'border-info-border bg-info-subtle text-info-subtle-foreground',
        tone === 'success' &&
          'border-success-border bg-success-subtle text-success-subtle-foreground'
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children}
      </div>
    </div>
  )
}

/** Which Meta account this environment writes to (US-08-06 criterion 10). */
export function TemplateEnvironment({
  environment,
}: {
  environment: TemplateAuthoringContext['environment']
}) {
  const t = useTranslations('adminTemplates.environment')
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
      <Badge variant={environment.production ? 'danger' : 'info'}>
        {environment.production ? t('production') : t('nonProduction')}
      </Badge>
      <span>
        {environment.account_suffix
          ? t.rich('account', {
              suffix: environment.account_suffix,
              code: (chunks) => (
                <span className="font-mono" dir="ltr">
                  {chunks}
                </span>
              ),
            })
          : t('accountMissing')}
      </span>
    </p>
  )
}

/** Why template writes are not offered to this staff member, if they are not. */
export function TemplateWriteAccess({
  operations,
}: {
  operations: TemplateAuthoringContext['operations']
}) {
  const t = useTranslations('adminTemplates.access')
  if (operations.enabled && operations.operator) return null
  return (
    <TemplateNotice
      tone="info"
      title={operations.enabled ? t('notOperator') : t('disabled')}
    />
  )
}

/** The validation findings of one field: the rule, and the record finding. */
export function TemplateIssues({
  id,
  issues,
}: {
  id: string
  issues: TemplateDraftIssue[]
}) {
  const t = useTranslations('adminTemplates.validation')
  if (issues.length === 0) return null
  return (
    <ul id={id} className="mt-1.5 space-y-1 text-xs">
      {issues.map((issue) => (
        <li
          key={`${issue.field}-${issue.rule}`}
          role={issue.severity === 'error' ? 'alert' : 'status'}
          className={
            issue.severity === 'error'
              ? 'text-destructive'
              : 'text-warning-subtle-foreground'
          }
        >
          {t.has(`rules.${issue.rule}`) ? t(`rules.${issue.rule}`) : issue.rule}
          {issue.finding !== 'akeed' && (
            <span className="text-muted-foreground ms-1">
              {t('finding', { finding: issue.finding })}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

interface TemplateConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  pending: boolean
  confirmDisabled?: boolean
  destructive?: boolean
  /** Shown instead of the confirm button once the action has run. */
  done?: boolean
  onConfirm: () => void
  children?: ReactNode
}

/**
 * The confirmation step of a template write. It states the effect before
 * anything is sent and cannot be dismissed while the request is running.
 */
export function TemplateConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  confirmDisabled,
  destructive,
  done,
  onConfirm,
  children,
}: TemplateConfirmDialogProps) {
  const t = useTranslations('adminTemplates.dialog')
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next)
      }}
    >
      <DialogContent
        closeLabel={t('close')}
        closeDisabled={pending}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">{children}</div>
        <DialogFooter>
          {done ? (
            <Button onClick={() => onOpenChange(false)}>{t('done')}</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                {t('cancel')}
              </Button>
              <Button
                variant={destructive ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={pending || confirmDisabled}
              >
                {pending ? t('working') : confirmLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
