'use client'

import Link from 'next/link'
import { Bell, Moon, Pencil, Zap, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akLink } from '@/shared/ui'
import {
  describeDelay,
  formatQuietWindow,
} from '@/features/dashboard/domain/settingsSummary'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'

/**
 * One setting as a quiet pill: icon, what it is, and its state as a word —
 * never a colour alone. Not a button; only "Edit settings" is clickable.
 */
function SettingChip({
  icon: Icon,
  label,
  value,
  isOn,
  isBrand = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  isOn: boolean
  /** An "On" word wears the brand colour; a value such as `15 min` doesn't. */
  isBrand?: boolean
}) {
  return (
    <li
      className={cn(
        'border-line bg-surface-raised text-ak-caption inline-flex h-8 items-center gap-1.5 rounded-full border px-3 whitespace-nowrap',
        isOn ? 'text-ink' : 'text-ink-muted'
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
      <span
        className={cn(
          'font-semibold',
          !isOn ? 'text-ink-muted' : isBrand ? 'text-brand-ink' : 'text-ink'
        )}
      >
        <bdi>{value}</bdi>
      </span>
    </li>
  )
}

/**
 * How confirmations behave right now, read from the real settings, as chips
 * under the page title with a link to change them.
 */
export function SettingsStatusLine({
  settings,
}: {
  settings: DashboardOverview['settings']
}) {
  const t = useTranslations('dashboard.standalone.settings')
  const tLabel = useTranslations('dashboard.overview.settings')
  const { locale } = useLocaleInfo()
  const delay = describeDelay(settings.follow_up_delay_minutes)
  const quietWindow = formatQuietWindow(
    settings.quiet_hours_start,
    settings.quiet_hours_end,
    locale
  )
  const quietOn = settings.quiet_hours_enabled && quietWindow !== null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label={tLabel('label')} className="flex flex-wrap gap-2">
        <SettingChip
          icon={Zap}
          label={t('autoConfirm')}
          value={settings.auto_verify_enabled ? t('on') : t('off')}
          isOn={settings.auto_verify_enabled}
          isBrand
        />
        <SettingChip
          icon={Bell}
          label={settings.follow_up_enabled ? t('reminder') : t('reminderOff')}
          value={
            settings.follow_up_enabled
              ? t(delay.unit, { count: delay.value })
              : t('off')
          }
          isOn={settings.follow_up_enabled}
        />
        <SettingChip
          icon={Moon}
          label={t('quietHours')}
          value={quietOn ? (quietWindow ?? '') : t('off')}
          isOn={quietOn}
        />
      </ul>
      <Link
        href={withLocale('/settings?tab=timing', locale)}
        aria-label={tLabel('editLabel')}
        className={cn(akLink, 'text-ak-caption h-8 px-2')}
      >
        <Pencil aria-hidden="true" className="size-4" />
        {t('edit')}
      </Link>
    </div>
  )
}
