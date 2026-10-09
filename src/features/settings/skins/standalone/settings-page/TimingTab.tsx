'use client'

import { useId, useMemo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import { buildAutomationTimeline } from '@/features/settings/domain/automationTimeline'
import {
  ESCALATION_PRESET_HOURS,
  hourPresetOptions,
  REMINDER_PRESET_HOURS,
  SEND_DELAY_PRESETS,
  type SendDelayChoice,
} from '@/features/settings/domain/delayPresets'
import { quietTimeValues } from '@/features/settings/domain/quietHours'
import {
  sendDelayChoicePatch,
  SETTINGS_FIELD_ID,
  timelineInputFromForm,
} from '@/features/settings/domain/settingsForm'
import { buildTimezoneOptions } from '@/features/settings/domain/timezoneOptions'
import type { StandaloneSettingsModel } from '@/features/settings/domain/useStandaloneSettings'
import { formatQuietTime } from '@/features/settings/skins/shared/settingsFormatters'
import { cn } from '@/shared/lib/utils'
import { AkSegmented, AkSelect } from '@/shared/ui'
import { AutomationFlowCard } from './AutomationFlowCard'
import {
  AnnotatedSection,
  AnnotatedSections,
  settingsRowPadding,
  SwitchSetting,
} from './SettingsSection'

interface TimingTabProps {
  model: StandaloneSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

const fieldLabelClass = 'text-ak-caption text-ink font-semibold'
const fieldErrorClass = 'text-ak-caption text-ak-warning font-semibold'

/** "After [2 h · 6 h · 12 h · 24 h] from the first message". */
function HoursChoice({
  before,
  after,
  groupLabel,
  options,
  minutes,
  disabled,
  onChange,
}: {
  before: string
  after: string
  groupLabel: string
  options: ReadonlyArray<{ value: string; label: string }>
  minutes: number
  disabled: boolean
  onChange: (minutes: number) => void
}) {
  return (
    <div className="text-ak-body text-ink flex flex-wrap items-center gap-2.5 px-4 pb-4 sm:px-6 sm:pb-5">
      <span>{before}</span>
      <AkSegmented
        aria-label={groupLabel}
        options={options}
        value={String(minutes)}
        disabled={disabled}
        onValueChange={(value) => onChange(Number(value))}
      />
      <span className="text-ink-muted">{after}</span>
    </div>
  )
}

function SelectField({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * When the confirmation goes out and what follows it: the live flow of one
 * order, then the send time, the reminder and no-reply alert, and the quiet
 * hours. Every control edits the page's one form.
 */
export function TimingTab({ model, data, readOnly }: TimingTabProps) {
  const t = useTranslations('settings.embedded.timing')
  const tPage = useTranslations('settings.standalone.page.timing')
  const tSettings = useTranslations('settings')
  const quietEndId = useId()
  const quietErrorId = useId()
  const timezoneErrorId = useId()
  const values = model.values
  const shopTimezone = data.state.shopTimezone ?? null

  const timezoneOptions = useMemo(
    () =>
      buildTimezoneOptions({
        shopTimezone,
        currentTimezone: values?.timezone,
        curatedLabel: (zone) =>
          tSettings(`automation.timezones.${zone.replaceAll('/', '_')}`),
        storeTimeLabel: (zone) => t('storeTime', { zone }),
      }),
    [shopTimezone, t, tSettings, values?.timezone]
  )

  if (!values) return null

  const timeline = buildAutomationTimeline(timelineInputFromForm(values))

  const sendChoices: ReadonlyArray<{ value: SendDelayChoice; label: string }> =
    [
      ...SEND_DELAY_PRESETS.map((preset) => ({
        value: preset.id,
        label: t(`sendPresets.${preset.id}`),
      })),
      { value: 'custom', label: t('sendPresets.custom') },
    ]

  const hourOptions = (presets: readonly number[], currentMinutes: number) =>
    hourPresetOptions(presets, currentMinutes).map((option) => ({
      value: String(option.minutes),
      label: t('hoursShort', { count: option.hours }),
    }))

  const timeOptions = quietTimeValues(
    values.quietHoursStart,
    values.quietHoursEnd
  ).map((value) => ({ value, label: formatQuietTime(t, value) }))

  const customDelayError = model.errors.sendDelayCustom
    ? t('customDelayError')
    : null
  const quietHoursError = model.errors.quietHours
    ? t(`quietErrors.${model.errors.quietHours}`)
    : null
  const timezoneError = model.errors.timezone
    ? t('quietErrors.unsupportedTimezone')
    : null

  return (
    <div className="space-y-6">
      <AutomationFlowCard timeline={timeline} />

      <AnnotatedSections>
        <AnnotatedSection
          title={t('autoHeading')}
          description={t('autoDescription')}
        >
          <SwitchSetting
            title={t('autoLabel')}
            help={tPage('autoHelp')}
            checked={values.isAutoVerifyEnabled}
            disabled={readOnly}
            onCheckedChange={(isAutoVerifyEnabled) =>
              model.update({ isAutoVerifyEnabled })
            }
          >
            {values.isAutoVerifyEnabled && (
              <div
                className={cn(
                  'border-line flex flex-col items-start gap-2.5 border-t',
                  settingsRowPadding
                )}
              >
                <p className={fieldLabelClass}>{t('sendTimeLabel')}</p>
                <AkSegmented
                  aria-label={t('sendTimeLabel')}
                  options={sendChoices}
                  value={values.sendDelayChoice}
                  disabled={readOnly}
                  onValueChange={(choice) =>
                    model.update(sendDelayChoicePatch(values, choice))
                  }
                />
                {values.sendDelayChoice === 'custom' && (
                  <div className="flex w-full max-w-60 flex-col gap-1.5">
                    <label
                      htmlFor={SETTINGS_FIELD_ID.sendDelayCustom}
                      className={fieldLabelClass}
                    >
                      {tPage('customDelayLabel')}
                    </label>
                    <div className="relative">
                      <input
                        id={SETTINGS_FIELD_ID.sendDelayCustom}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={values.sendDelayCustom}
                        onChange={(event) =>
                          model.update({
                            sendDelayCustom: event.target.value.trim(),
                          })
                        }
                        disabled={readOnly}
                        aria-invalid={customDelayError ? true : undefined}
                        className={cn(
                          'ak-focus bg-surface-raised text-ink text-ak-body rounded-ak-control h-10 w-full border ps-3 pe-16 tabular-nums disabled:cursor-not-allowed disabled:opacity-60',
                          customDelayError
                            ? 'border-ak-warning'
                            : 'border-control-border'
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className="text-ak-caption text-ink-muted pointer-events-none absolute end-3 top-1/2 -translate-y-1/2"
                      >
                        {t('customDelaySuffix')}
                      </span>
                    </div>
                    {customDelayError && (
                      <p role="alert" className={fieldErrorClass}>
                        {customDelayError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </SwitchSetting>
        </AnnotatedSection>

        <AnnotatedSection
          title={t('followHeading')}
          description={t('followDescription')}
        >
          <SwitchSetting
            title={t('reminderLabel')}
            checked={values.followUpEnabled}
            disabled={readOnly}
            onCheckedChange={(followUpEnabled) =>
              model.update({ followUpEnabled })
            }
          >
            {values.followUpEnabled && (
              <HoursChoice
                before={t('after')}
                after={t('fromFirstMessage')}
                groupLabel={t('reminderGroup')}
                options={hourOptions(
                  REMINDER_PRESET_HOURS,
                  values.followUpDelayMinutes
                )}
                minutes={values.followUpDelayMinutes}
                disabled={readOnly}
                onChange={(followUpDelayMinutes) =>
                  model.update({ followUpDelayMinutes })
                }
              />
            )}
          </SwitchSetting>
          <SwitchSetting
            title={t('alertLabel')}
            checked={values.escalationEnabled}
            disabled={readOnly}
            onCheckedChange={(escalationEnabled) =>
              model.update({ escalationEnabled })
            }
          >
            {values.escalationEnabled && (
              <HoursChoice
                before={t('after')}
                after={
                  values.followUpEnabled
                    ? t('fromReminder')
                    : t('fromFirstMessage')
                }
                groupLabel={t('alertGroup')}
                options={hourOptions(
                  ESCALATION_PRESET_HOURS,
                  values.escalationGapMinutes
                )}
                minutes={values.escalationGapMinutes}
                disabled={readOnly}
                onChange={(escalationGapMinutes) =>
                  model.update({ escalationGapMinutes })
                }
              />
            )}
          </SwitchSetting>
        </AnnotatedSection>

        <AnnotatedSection
          title={t('quietHeading')}
          description={tPage('quietDesc')}
        >
          <SwitchSetting
            title={t('quietLabel')}
            help={tPage('quietHelp')}
            checked={values.quietHoursEnabled}
            disabled={readOnly}
            onCheckedChange={model.setQuietHoursEnabled}
          >
            {values.quietHoursEnabled && (
              <div className="space-y-2 px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField
                    id={SETTINGS_FIELD_ID.quietHours}
                    label={t('quietFrom')}
                  >
                    <AkSelect
                      id={SETTINGS_FIELD_ID.quietHours}
                      options={timeOptions}
                      value={values.quietHoursStart}
                      disabled={readOnly}
                      aria-invalid={quietHoursError ? true : undefined}
                      aria-describedby={
                        quietHoursError ? quietErrorId : undefined
                      }
                      onChange={(event) =>
                        model.update({ quietHoursStart: event.target.value })
                      }
                    />
                  </SelectField>
                  <SelectField id={quietEndId} label={t('quietTo')}>
                    <AkSelect
                      id={quietEndId}
                      options={timeOptions}
                      value={values.quietHoursEnd}
                      disabled={readOnly}
                      aria-invalid={quietHoursError ? true : undefined}
                      aria-describedby={
                        quietHoursError ? quietErrorId : undefined
                      }
                      onChange={(event) =>
                        model.update({ quietHoursEnd: event.target.value })
                      }
                    />
                  </SelectField>
                  <SelectField
                    id={SETTINGS_FIELD_ID.timezone}
                    label={t('timezoneLabel')}
                  >
                    <AkSelect
                      id={SETTINGS_FIELD_ID.timezone}
                      options={timezoneOptions}
                      value={values.timezone}
                      disabled={readOnly}
                      aria-invalid={timezoneError ? true : undefined}
                      aria-describedby={
                        timezoneError ? timezoneErrorId : undefined
                      }
                      onChange={(event) =>
                        model.update({ timezone: event.target.value })
                      }
                    />
                  </SelectField>
                </div>
                {quietHoursError && (
                  <p id={quietErrorId} role="alert" className={fieldErrorClass}>
                    {quietHoursError}
                  </p>
                )}
                {timezoneError && (
                  <p
                    id={timezoneErrorId}
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {timezoneError}
                  </p>
                )}
              </div>
            )}
          </SwitchSetting>
        </AnnotatedSection>
      </AnnotatedSections>
    </div>
  )
}
