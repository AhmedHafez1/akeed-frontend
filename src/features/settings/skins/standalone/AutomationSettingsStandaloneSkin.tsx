'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import type { AutomationTimezone } from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import { Button, Card, HelpButton, Input, Label } from '@/shared/ui'

interface FieldProps {
  label: string
  error?: string
  helpText?: string
  children: ReactNode
}

function HelpIcon({ content }: { content: string }) {
  return (
    <span
      title={content}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
    >
      ?
    </span>
  )
}

function Field({ label, error, helpText, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {helpText ? <HelpIcon content={helpText} /> : null}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function NativeSelect<TValue extends string>({
  value,
  options,
  onChange,
}: {
  value: TValue
  options: ReadonlyArray<{ label: string; value: TValue }>
  onChange: (value: TValue) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="h-12 w-full appearance-none rounded-lg border-2 border-gray-200 bg-white py-2 ps-4 pe-11 text-base transition-colors outline-none focus:border-emerald-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
      />
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="space-y-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {label}
          <HelpIcon content={description} />
        </span>
      </span>
    </label>
  )
}

export function AutomationSettingsStandaloneSkin(props: SettingsSkinProps) {
  const t = useTranslations('settings')

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('automation.title')}
        </h1>
        <p className="text-sm text-slate-500">{t('automation.subtitle')}</p>
      </div>

      {props.errorBanner && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {props.errorBanner}
        </div>
      )}

      {props.successBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {props.successBanner}
        </div>
      )}

      {!props.canUpdateConfiguration && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {t('readOnly')}
        </div>
      )}

      <fieldset disabled={!props.canUpdateConfiguration}>
        <Card className="border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t('automation.heading')}
                  </h2>
                  <HelpIcon content={t('automation.description')} />
                </div>
                <HelpButton article="automationRules" />
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {t('automation.trustSignal')}
                </p>
              </div>

              {props.canUpdateConfiguration && (
                <Button
                  type="button"
                  disabled={props.isSaving}
                  onClick={() => void props.onSave()}
                >
                  {props.isSaving ? t('savingButton') : t('saveButton')}
                </Button>
              )}
            </div>

            <ToggleRow
              label={t('autoVerifyLabel')}
              description={t('autoVerifyDescription')}
              checked={props.isAutoVerifyEnabled}
              onChange={props.onAutoVerifyChange}
            />

            <Field
              label={t('automation.sendDelayMinutesLabel')}
              helpText={t('automation.sendDelayMinutesHelp')}
              error={props.sendDelayMinutesError}
            >
              <Input
                type="number"
                min={0}
                max={24}
                step={0.25}
                value={props.sendDelayMinutes}
                onChange={(event) =>
                  props.onSendDelayMinutesChange(event.target.value)
                }
              />
            </Field>

            <div className="border-t border-slate-100 pt-5">
              <ToggleRow
                label={t('automation.followUpEnabledLabel')}
                description={t('automation.followUpEnabledHelp')}
                checked={props.followUpEnabled}
                onChange={props.onFollowUpEnabledChange}
              />
            </div>

            <Field
              label={t('automation.followUpDelayMinutesLabel')}
              error={props.followUpDelayMinutesError}
            >
              <Input
                type="number"
                min={0}
                max={168}
                step={0.25}
                disabled={!props.followUpEnabled}
                value={props.followUpDelayMinutes}
                onChange={(event) =>
                  props.onFollowUpDelayMinutesChange(event.target.value)
                }
              />
            </Field>

            <div className="border-t border-slate-100 pt-5">
              <ToggleRow
                label={t('automation.escalationEnabledLabel')}
                description={t('automation.escalationEnabledHelp')}
                checked={props.escalationEnabled}
                onChange={props.onEscalationEnabledChange}
              />
            </div>

            <Field
              label={t('automation.escalationDelayMinutesLabel')}
              helpText={t('automation.escalationDelayMinutesHelp')}
              error={props.escalationDelayMinutesError}
            >
              <Input
                type="number"
                min={0}
                max={168}
                step={0.25}
                disabled={!props.escalationEnabled}
                value={props.escalationDelayMinutes}
                onChange={(event) =>
                  props.onEscalationDelayMinutesChange(event.target.value)
                }
              />
            </Field>

            <div className="border-t border-slate-100 pt-5">
              <ToggleRow
                label={t('automation.quietHoursEnabledLabel')}
                description={t('automation.quietHoursEnabledHelp')}
                checked={props.quietHoursEnabled}
                onChange={props.onQuietHoursEnabledChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={t('automation.quietHoursStartLabel')}
                error={props.quietHoursError}
              >
                <Input
                  type="time"
                  disabled={!props.quietHoursEnabled}
                  value={props.quietHoursStart}
                  onChange={(event) =>
                    props.onQuietHoursStartChange(event.target.value)
                  }
                />
              </Field>
              <Field label={t('automation.quietHoursEndLabel')}>
                <Input
                  type="time"
                  disabled={!props.quietHoursEnabled}
                  value={props.quietHoursEnd}
                  onChange={(event) =>
                    props.onQuietHoursEndChange(event.target.value)
                  }
                />
              </Field>
              <Field label={t('automation.timezoneLabel')}>
                <NativeSelect<AutomationTimezone>
                  value={props.timezone}
                  options={props.timezoneOptions}
                  onChange={props.onTimezoneChange}
                />
              </Field>
            </div>
          </div>
        </Card>
      </fieldset>
    </div>
  )
}
