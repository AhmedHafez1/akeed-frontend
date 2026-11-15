import { Icon, Text, useBreakpoints } from '@shopify/polaris'
import { EditIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  describeDelay,
  formatQuietWindow,
} from '../../../../domain/settingsSummary'
import type { DashboardOverview } from '../../../../model/dashboard.model'

function StatusItem({
  compact,
  isOn,
  label,
  stateLabel,
}: {
  compact: boolean
  isOn: boolean
  label: string
  stateLabel: string
}) {
  return (
    <li
      className={`inline-flex items-center whitespace-nowrap ${compact ? 'gap-1' : 'gap-1.5'}`}
    >
      <span
        aria-hidden="true"
        className="inline-block size-2 shrink-0 rounded-full"
        style={{
          background: isOn
            ? 'var(--p-color-bg-fill-success)'
            : 'var(--p-color-icon-disabled)',
        }}
      />
      <Text as="span" variant={compact ? 'bodySm' : 'bodyMd'} tone="subdued">
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

  // A phone gets small text, tighter gaps, the short reminder wording and an
  // icon-only edit button, so the whole line fits on one row.
  const { mdUp } = useBreakpoints({ defaults: { mdUp: true } })
  const compact = !mdUp
  const reminderKey =
    delay.unit === 'hours'
      ? compact
        ? 'followUpHoursShort'
        : 'followUpHours'
      : compact
        ? 'followUpMinutesShort'
        : 'followUpMinutes'
  const gap = compact ? 'gap-x-2' : 'gap-x-4'

  return (
    <div className={`flex flex-wrap items-center gap-y-1 ${gap}`}>
      <ul
        aria-label={t('label')}
        className={`m-0 flex list-none flex-wrap items-center gap-y-1 p-0 ${gap}`}
      >
        <StatusItem
          compact={compact}
          isOn={settings.auto_verify_enabled}
          label={
            settings.auto_verify_enabled
              ? t(compact ? 'autoConfirmShort' : 'autoConfirm')
              : t('autoConfirmOff')
          }
          stateLabel={settings.auto_verify_enabled ? t('on') : t('off')}
        />
        <StatusItem
          compact={compact}
          isOn={settings.follow_up_enabled}
          label={
            settings.follow_up_enabled
              ? t(reminderKey, { count: delay.value })
              : t('followUpOff')
          }
          stateLabel={settings.follow_up_enabled ? t('on') : t('off')}
        />
        <StatusItem
          compact={compact}
          isOn={quietOn}
          label={
            quietOn
              ? t('quietHours', { window: quietWindow })
              : t('quietHoursOff')
          }
          stateLabel={quietOn ? t('on') : t('off')}
        />
      </ul>
      {/* Dark text with an edit icon, in the look of the main tabs rather
          than Polaris's blue link; the underline appears on hover. */}
      <button
        type="button"
        onClick={onEdit}
        aria-label={t('editLabel')}
        className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-(--p-color-text) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-color-border-focus)"
      >
        <span aria-hidden="true" className="shrink-0">
          <Icon source={EditIcon} tone="inherit" />
        </span>
        {!compact && (
          <Text as="span" variant="bodyMd" fontWeight="medium">
            {t('edit')}
          </Text>
        )}
      </button>
    </div>
  )
}
