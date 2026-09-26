'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  describeDelay,
  formatQuietWindow,
} from '@/features/dashboard/domain/settingsSummary'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'

function StatusItem({
  isOn,
  label,
  stateLabel,
}: {
  isOn: boolean
  label: string
  stateLabel: string
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn(
          'inline-block size-2 shrink-0 rounded-full',
          isOn ? 'bg-success' : 'bg-muted-foreground/50'
        )}
      />
      <span className="text-muted-foreground text-sm">
        {label}
        <span className="sr-only"> ({stateLabel})</span>
      </span>
    </li>
  )
}

/**
 * One line under the title saying how confirmations currently behave, read
 * from the real settings, with a link to change them. Plain text with status
 * dots, deliberately not pills: none of it is clickable except "Edit".
 */
export function SettingsStatusLine({
  settings,
}: {
  settings: DashboardOverview['settings']
}) {
  const t = useTranslations('dashboard.overview.settings')
  const { locale } = useLocaleInfo()
  const delay = describeDelay(settings.follow_up_delay_minutes)
  const quietWindow = formatQuietWindow(
    settings.quiet_hours_start,
    settings.quiet_hours_end,
    locale
  )
  const quietOn = settings.quiet_hours_enabled && quietWindow !== null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <ul
        aria-label={t('label')}
        className="flex flex-wrap items-center gap-x-4 gap-y-1"
      >
        <StatusItem
          isOn={settings.auto_verify_enabled}
          label={
            settings.auto_verify_enabled
              ? t('autoConfirm')
              : t('autoConfirmOff')
          }
          stateLabel={settings.auto_verify_enabled ? t('on') : t('off')}
        />
        <StatusItem
          isOn={settings.follow_up_enabled}
          label={
            settings.follow_up_enabled
              ? delay.unit === 'hours'
                ? t('followUpHours', { count: delay.value })
                : t('followUpMinutes', { count: delay.value })
              : t('followUpOff')
          }
          stateLabel={settings.follow_up_enabled ? t('on') : t('off')}
        />
        <StatusItem
          isOn={quietOn}
          label={
            quietOn
              ? t('quietHours', { window: quietWindow })
              : t('quietHoursOff')
          }
          stateLabel={quietOn ? t('on') : t('off')}
        />
      </ul>
      <Link
        href={withLocale('/settings', locale)}
        aria-label={t('editLabel')}
        className="text-primary-subtle-foreground focus-visible:ring-ring rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        {t('edit')}
      </Link>
    </div>
  )
}
