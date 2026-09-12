'use client'

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { CreditSummary } from '../../domain/billing.types'

type Tone = 'healthy' | 'warning' | 'danger' | 'muted'

const TONE_CLASS: Record<Tone, string> = {
  healthy:
    'border-primary-border bg-primary-subtle text-primary-subtle-foreground',
  warning:
    'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  danger:
    'border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
  muted: 'border-border bg-muted text-foreground',
}

const TONE_ICON = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle,
  muted: Info,
} as const

/**
 * The ladder is ordered by severity, not by field: an account that is
 * suspended *and* low is suspended first. Preserved verbatim from the previous
 * implementation — only the presentation changed.
 */
function resolve(summary: CreditSummary) {
  if (summary.status === 'pending_approval')
    return { tone: 'warning' as Tone, key: 'pending' }
  if (summary.status === 'suspended')
    return { tone: 'danger' as Tone, key: 'suspended' }
  if (summary.status === 'not_provisioned')
    return { tone: 'muted' as Tone, key: 'notProvisioned' }
  if (summary.debtCredits > 0) return { tone: 'danger' as Tone, key: 'debt' }
  if (summary.availableCredits === 0)
    return { tone: 'danger' as Tone, key: 'zero' }
  if (summary.availableCredits <= summary.lowBalanceThreshold)
    return { tone: 'warning' as Tone, key: 'low' }
  return { tone: 'healthy' as Tone, key: 'healthy' }
}

export function AccountNotice({ summary }: { summary: CreditSummary }) {
  const t = useTranslations('billing')
  const { tone, key } = resolve(summary)
  const Icon = TONE_ICON[tone]

  const title = t(`alerts.${key}Title`, {
    count: key === 'debt' ? summary.debtCredits : summary.availableCredits,
  })
  const description = t(`alerts.${key}Description`, {
    threshold: summary.lowBalanceThreshold,
  })

  return (
    <div
      role="status"
      className={cn(
        'rounded-card text-body flex flex-col gap-2 border p-4 sm:flex-row sm:items-center sm:gap-3',
        TONE_CLASS[tone]
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">{title}</span>{' '}
        <span className="opacity-85">{description}</span>
      </p>
    </div>
  )
}
