import { Link, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  describeDelay,
  formatQuietWindow,
} from '../../../../domain/settingsSummary'
import type { DashboardOverview } from '../../../../model/dashboard.model'

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
        className="inline-block size-2 shrink-0 rounded-full"
        style={{
          background: isOn
            ? 'var(--p-color-bg-fill-success)'
            : 'var(--p-color-icon-disabled)',
        }}
      />
      <Text as="span" variant="bodyMd" tone="subdued">
        {label}
        <span className="sr-only"> ({stateLabel})</span>
      </Text>
    </li>
  )
}

/**
 * One line under the title saying how confirmations currently behave, read
 * from the real settings, with a link to change them. Plain text with status
 * dots, deliberately not pills: none of it is clickable except "تعديل".
 */
export function SettingsStatusLine({
  settings,
  onEdit,
}: {
  settings: DashboardOverview['settings']
  onEdit: () => void
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
        className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0"
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
      <Link onClick={onEdit} accessibilityLabel={t('editLabel')}>
        {t('edit')}
      </Link>
    </div>
  )
}
