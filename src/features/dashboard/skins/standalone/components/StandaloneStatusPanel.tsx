'use client'

import Link from 'next/link'
import { ArrowRight, CircleAlert, Pause, Radio } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'

export type StandaloneVerificationState = 'active' | 'paused' | 'disconnected'

interface StandaloneStatusPanelProps {
  state: StandaloneVerificationState
}

const stateStyles: Record<
  StandaloneVerificationState,
  { surface: string; icon: string }
> = {
  active: {
    surface: 'border-border bg-card',
    icon: 'border-primary-border bg-primary-subtle text-primary',
  },
  paused: {
    surface: 'border-warning-border bg-warning-subtle/80',
    icon: 'border-warning-border bg-card text-warning',
  },
  disconnected: {
    surface: 'border-destructive-border bg-destructive-subtle/70',
    icon: 'border-destructive-border bg-card text-destructive-subtle-foreground',
  },
}

export function StandaloneStatusPanel({ state }: StandaloneStatusPanelProps) {
  const t = useTranslations('dashboard.standalone.status')
  const { locale } = useLocaleInfo()
  const Icon =
    state === 'active' ? Radio : state === 'paused' ? Pause : CircleAlert
  const styles = stateStyles[state]

  return (
    <section
      aria-labelledby="verification-status-title"
      className={cn(
        'rounded-card flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        styles.surface
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
            styles.icon
          )}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2
            id="verification-status-title"
            className="text-foreground text-sm font-bold"
          >
            {t(`${state}.title`)}
          </h2>
          <p className="text-foreground/70 mt-0.5 text-sm leading-5">
            {t(`${state}.description`)}
          </p>
        </div>
      </div>

      <Link
        href={`${withLocale('/settings', locale)}#automation-settings`}
        className="text-primary-subtle-foreground hover:bg-card/70 focus-visible:ring-ring inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:self-auto"
      >
        {t('action')}
        <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </section>
  )
}
