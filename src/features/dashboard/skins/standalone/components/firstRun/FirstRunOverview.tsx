'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'
import { SettingsStatusLine } from '../overview/SettingsStatusLine'
import { FirstOrderCard } from './FirstOrderCard'
import { FirstRunConfirmationsCard } from './FirstRunConfirmationsCard'
import { SkippedTestBanner } from './SkippedTestBanner'

interface FirstRunOverviewProps {
  firstName?: string | null
  /** Null until the overview has loaded; the chips wait for it. */
  settings: DashboardOverview['settings'] | null
  showSkippedTestReminder: boolean
  /** "Send it to my phone"; omitted for viewers, who cannot send. */
  phoneTestAction?: ReactNode
}

/**
 * The standalone dashboard before the first real order: a greeting, how
 * confirmations behave, one card to add the first order, and where the
 * results will appear. No KPIs, so the merchant never looks at a row of zeros.
 */
export function FirstRunOverview({
  firstName,
  settings,
  showSkippedTestReminder,
  phoneTestAction,
}: FirstRunOverviewProps) {
  const t = useTranslations('dashboard.firstRun')

  return (
    <div className="space-y-6">
      <header className="space-y-3 text-start">
        <h1 className="text-ink text-h2 font-bold">
          {firstName ? t('greeting', { name: firstName }) : t('greetingNoName')}
        </h1>
        {settings && <SettingsStatusLine settings={settings} />}
      </header>

      <FirstOrderCard
        banner={
          showSkippedTestReminder ? (
            <SkippedTestBanner action={phoneTestAction} />
          ) : undefined
        }
      />
      <FirstRunConfirmationsCard />
    </div>
  )
}
