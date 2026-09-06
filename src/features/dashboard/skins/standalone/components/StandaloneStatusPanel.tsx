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
    surface: 'border-emerald-200 bg-emerald-50/70',
    icon: 'border-emerald-200 bg-white text-emerald-700',
  },
  paused: {
    surface: 'border-amber-200 bg-amber-50/80',
    icon: 'border-amber-200 bg-white text-amber-700',
  },
  disconnected: {
    surface: 'border-red-200 bg-red-50/70',
    icon: 'border-red-200 bg-white text-red-700',
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
        'flex flex-col gap-4 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        styles.surface
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
            styles.icon
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2
            id="verification-status-title"
            className="text-sm font-bold text-slate-950"
          >
            {t(`${state}.title`)}
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-slate-600">
            {t(`${state}.description`)}
          </p>
        </div>
      </div>

      <Link
        href={`${withLocale('/settings', locale)}#automation-settings`}
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:self-auto"
      >
        {t('action')}
        <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </section>
  )
}
