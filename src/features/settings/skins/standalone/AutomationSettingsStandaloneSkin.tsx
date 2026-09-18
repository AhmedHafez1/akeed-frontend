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
      className="border-input text-muted-foreground inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold"
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
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
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
        className="border-border bg-card focus:border-primary h-12 w-full appearance-none rounded-lg border-2 py-2 ps-4 pe-11 text-base transition-colors outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2"
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
    <label className="rounded-card border-border bg-muted hover:bg-muted/70 flex cursor-pointer items-start gap-3 border p-4 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="text-primary border-input focus:ring-ring mt-1 h-4 w-4 rounded"
      />
      <span className="space-y-1">
        <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
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
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {t('automation.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('automation.subtitle')}
        </p>
      </div>

      {props.errorBanner && (
        <div className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-xl border px-4 py-3 text-sm">
          {props.errorBanner}
        </div>
      )}

      {props.successBanner && (
        <div className="border-primary-border bg-primary-subtle text-primary rounded-xl border px-4 py-3 text-sm">
          {props.successBanner}
        </div>
      )}

      {!props.canUpdateConfiguration && (
        <div
          role="status"
          className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-xl border px-4 py-3 text-sm"
        >
          {t('readOnly')}
        </div>
      )}

      <fieldset disabled={!props.canUpdateConfiguration}>
        <Card className="p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-foreground text-lg font-semibold">
                    {t('automation.heading')}
                  </h2>
                  <HelpIcon content={t('automation.description')} />
                </div>
                <HelpButton article="automationRules" />
                <p className="border-primary-border bg-primary-subtle text-primary inline-flex rounded-full border px-3 py-1 text-xs font-medium">
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

            <div className="border-border border-t pt-5">
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

            <div className="border-border border-t pt-5">
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

            <div className="border-border border-t pt-5">
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
