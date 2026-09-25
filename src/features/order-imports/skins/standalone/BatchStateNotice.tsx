'use client'

import Link from 'next/link'
import {
  Clock,
  FileQuestion,
  Lock,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { Button } from '@/shared/ui'
import { importModalPath } from '../../domain/importRoutes'

export type BatchState =
  | 'notFound'
  | 'expired'
  | 'unavailable'
  | 'disabled'
  | 'loadFailed'

const stateIcons: Record<BatchState, LucideIcon> = {
  notFound: FileQuestion,
  expired: Clock,
  unavailable: Lock,
  disabled: Lock,
  loadFailed: WifiOff,
}

interface BatchStateNoticeProps {
  state: BatchState
  /** A localized batch status, for `unavailable`. */
  status?: string
  onRetry?: () => void
}

/** Full-page states outside the three steps (story AC10, AC11). */
export function BatchStateNotice({
  state,
  status,
  onRetry,
}: BatchStateNoticeProps) {
  const t = useTranslations('orderImport.states')
  const locale = useLocale()
  const Icon = stateIcons[state]
  const target =
    state === 'disabled'
      ? withLocale('/verifications', locale)
      : withLocale(importModalPath('new'), locale)

  return (
    <div
      role={state === 'loadFailed' ? 'alert' : 'status'}
      className="rounded-panel border-border bg-card flex flex-col items-center gap-4 border px-6 py-14 text-center"
    >
      <span className="bg-muted text-muted-foreground inline-flex size-14 items-center justify-center rounded-full">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <div className="max-w-md space-y-1.5">
        <h2 className="text-foreground text-h3 font-semibold">
          {t(`${state}.title`)}
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          {t(`${state}.body`, { status: status ?? '' })}
        </p>
      </div>
      {state === 'loadFailed' && onRetry ? (
        <Button type="button" onClick={onRetry}>
          {t('loadFailed.action')}
        </Button>
      ) : (
        <Button asChild>
          <Link href={target}>{t(`${state}.action`)}</Link>
        </Button>
      )}
    </div>
  )
}
