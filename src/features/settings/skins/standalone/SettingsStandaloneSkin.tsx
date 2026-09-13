'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Info,
  LoaderCircle,
  Settings2,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import type {
  AutomationTimezone,
  IntegrationOnboardingLanguage,
} from '@/features/onboarding'
import { useBillingSummary } from '@/features/billing'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import { Button, Card, Input, Label, notify } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { TemplatesStandaloneSkin } from './TemplatesStandaloneSkin'

const SETTINGS_SECTION_QUERY_KEY = 'section'

type SettingsSection = 'general' | 'automation' | 'billing'

const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  'general',
  'automation',
  'billing',
]

interface FieldProps {
  label: string
  error?: string
  helpText?: string
  children: React.ReactNode
}

function Field({ label, error, helpText, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {helpText && (
          <span
            title={helpText}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
          >
            ?
          </span>
        )}
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
  disabled = false,
}: {
  value: TValue
  options: ReadonlyArray<{ label: string; value: TValue }>
  onChange: (value: TValue) => void
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="border-border h-12 w-full appearance-none rounded-lg border-2 bg-white py-2 ps-4 pe-11 text-base transition-colors outline-none focus:border-emerald-500"
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

function SettingsSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]',
          checked ? 'start-[22px]' : 'start-0.5'
        )}
      />
    </button>
  )
}

function SettingsCard({
  title,
  description,
  checked,
  switchLabel,
  switchDisabled = false,
  onCheckedChange,
  children,
}: {
  title: string
  description: string
  checked?: boolean
  switchLabel?: string
  switchDisabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  children?: React.ReactNode
}) {
  const hasSwitch =
    checked !== undefined && switchLabel !== undefined && onCheckedChange

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-none">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {hasSwitch && (
          <SettingsSwitch
            checked={checked}
            disabled={switchDisabled}
            label={switchLabel}
            onChange={onCheckedChange}
          />
        )}
      </div>
      {children && (
        <div className="border-t border-slate-200 p-5 sm:p-6">{children}</div>
      )}
    </Card>
  )
}

function DelayPicker({
  value,
  presets,
  customLabel,
  inputLabel,
  error,
  disabled,
  max,
  onChange,
}: {
  value: string
  presets: ReadonlyArray<{ label: string; value: string }>
  customLabel: string
  inputLabel: string
  error?: string
  disabled: boolean
  max: number
  onChange: (value: string) => void
}) {
  const matchesPreset = presets.some((preset) => preset.value === value)
  const [isCustomOpen, setIsCustomOpen] = useState(!matchesPreset)
  const inputId = useId()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap" role="group" aria-label={inputLabel}>
        {presets.map((preset) => {
          const isSelected = !isCustomOpen && preset.value === value
          return (
            <button
              key={preset.value}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => {
                setIsCustomOpen(false)
                onChange(preset.value)
              }}
              className={cn(
                '-ms-px min-h-10 border border-slate-200 px-4 text-sm first:ms-0 first:rounded-s-lg last:rounded-e-lg focus:z-10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'z-10 border-emerald-500 bg-emerald-50 font-medium text-emerald-800'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              {preset.label}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={isCustomOpen}
          disabled={disabled}
          onClick={() => setIsCustomOpen(true)}
          className={cn(
            '-ms-px min-h-10 rounded-e-lg border border-slate-200 px-4 text-sm focus:z-10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            isCustomOpen
              ? 'z-10 border-emerald-500 bg-emerald-50 font-medium text-emerald-800'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          )}
        >
          {customLabel}
        </button>
      </div>
      {isCustomOpen && (
        <div className="max-w-xs">
          <Label htmlFor={inputId}>{inputLabel}</Label>
          <Input
            id={inputId}
            type="number"
            min={0}
            max={max}
            step={0.25}
            disabled={disabled}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2"
          />
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function SaveStatus({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings.standalone')

  if (props.isSaving) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm text-slate-600"
      >
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {t('saveState.saving')}
      </span>
    )
  }

  if (props.saveFailed && props.isDirty) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-medium text-red-700"
      >
        <AlertCircle className="h-4 w-4" />
        {t('saveState.failed')}
      </span>
    )
  }

  if (props.isDirty) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-medium text-amber-700"
      >
        <Clock3 className="h-4 w-4" />
        {t('saveState.unsaved')}
      </span>
    )
  }

  return null
}

function StandaloneSettingsExperience({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings')
  const standaloneT = useTranslations('settings.standalone')
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const { summary: billingSummary } = useBillingSummary()
  const searchParams = useSearchParams()
  const requestedSection = searchParams.get(SETTINGS_SECTION_QUERY_KEY)
  const billingSectionEnabled = billingSummary?.billingEnabled === true
  const selectedSection: SettingsSection =
    SETTINGS_SECTIONS.includes(requestedSection as SettingsSection) &&
    (requestedSection !== 'billing' || billingSectionEnabled)
      ? (requestedSection as SettingsSection)
      : 'general'
  const fieldsDisabled = !props.canUpdateConfiguration || props.isSaving

  useEffect(() => {
    if (props.successBanner && !props.isDirty) {
      notify.success({
        id: 'settings-save-success',
        message: props.successBanner,
      })
    }
  }, [props.isDirty, props.successBanner])

  const navigateToSection = (section: SettingsSection) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set(SETTINGS_SECTION_QUERY_KEY, section)
    router.push(`${pathname}?${nextParams.toString()}`, { scroll: false })
  }

  const copySourceIdentity = async () => {
    try {
      await navigator.clipboard.writeText(props.sourceIdentity)
      notify.success({
        id: 'settings-source-copied',
        message: standaloneT('general.copySuccess'),
      })
    } catch {
      notify.error({
        id: 'settings-source-copy-error',
        message: standaloneT('general.copyError'),
      })
    }
  }

  const navigationItems = [
    {
      id: 'general' as const,
      label: standaloneT('nav.general'),
      icon: Settings2,
    },
    {
      id: 'automation' as const,
      label: standaloneT('nav.automation'),
      icon: Zap,
    },
    ...(billingSummary?.billingEnabled
      ? [
          {
            id: 'billing' as const,
            label: standaloneT('nav.billing'),
            icon: CircleDollarSign,
          },
        ]
      : []),
  ]

  const firstDelayPresets = [
    { label: standaloneT('delay.immediately'), value: '0' },
    { label: standaloneT('delay.minutes', { value: 15 }), value: '0.25' },
    { label: standaloneT('delay.minutes', { value: 30 }), value: '0.5' },
  ]
  const followUpDelayPresets = [
    { label: standaloneT('delay.hours', { value: 2 }), value: '2' },
    { label: standaloneT('delay.hours', { value: 4 }), value: '4' },
    { label: standaloneT('delay.hours', { value: 24 }), value: '24' },
  ]
  const escalationDelayPresets = [
    { label: standaloneT('delay.hours', { value: 6 }), value: '6' },
    { label: standaloneT('delay.hours', { value: 12 }), value: '12' },
    { label: standaloneT('delay.hours', { value: 24 }), value: '24' },
  ]
  const formatDelay = (value: string) => {
    const hours = Number(value)
    if (!Number.isFinite(hours)) return value
    if (hours === 0) return standaloneT('delay.immediately')
    if (hours < 1) {
      return standaloneT('delay.minutes', { value: Math.round(hours * 60) })
    }
    return standaloneT('delay.hours', { value: hours })
  }

  return (
    <div className={cn('mx-auto max-w-7xl', props.isDirty && 'pb-28')}>
      <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
            {standaloneT('eyebrow')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500">{standaloneT('subtitle')}</p>
        </div>
        <SaveStatus props={props} />
      </header>

      {props.errorBanner && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {props.errorBanner}
        </div>
      )}

      {!props.canUpdateConfiguration && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t('readOnly')}
        </div>
      )}

      <div className="space-y-6">
        <nav
          aria-label={standaloneT('nav.label')}
          className="overflow-x-auto border-b border-slate-200"
        >
          <div className="flex min-w-max gap-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isSelected = selectedSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isSelected ? 'page' : undefined}
                  onClick={() => navigateToSection(item.id)}
                  className={cn(
                    'flex min-h-12 items-center gap-2 border-b-2 px-1 text-sm font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none',
                    isSelected
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <main id={`settings-panel-${selectedSection}`} className="min-w-0">
          {selectedSection === 'general' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {standaloneT('general.title')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {standaloneT('general.description')}
                </p>
              </div>

              <SettingsCard
                title={t('sourceHeading')}
                description={standaloneT('general.sourceDescription')}
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {props.sourcePlatformType === 'standalone'
                      ? t('sourceStandalone')
                      : props.sourcePlatformType}
                  </div>
                  <details className="rounded-lg border border-slate-200 bg-slate-50/70">
                    <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none">
                      {standaloneT('general.connectionDetails')}
                    </summary>
                    <div className="flex flex-col gap-3 border-t border-slate-200 p-3 sm:flex-row sm:items-center">
                      <code
                        dir="ltr"
                        className="min-w-0 flex-1 text-xs break-all text-slate-600"
                      >
                        {props.sourceIdentity}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copySourceIdentity()}
                      >
                        {standaloneT('general.copy')}
                      </Button>
                    </div>
                  </details>
                </div>
              </SettingsCard>

              <SettingsCard
                title={t('storeConfigurationHeading')}
                description={standaloneT('general.storeDescription')}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t('storeNameLabel')}
                    error={props.storeNameError}
                  >
                    <Input
                      value={props.storeName}
                      disabled={fieldsDisabled}
                      onChange={(event) =>
                        props.onStoreNameChange(event.target.value)
                      }
                      autoComplete="organization"
                    />
                  </Field>
                  <Field label={t('defaultLanguageLabel')}>
                    <NativeSelect<IntegrationOnboardingLanguage>
                      value={props.defaultLanguage}
                      options={props.languageOptions}
                      disabled={fieldsDisabled}
                      onChange={props.onDefaultLanguageChange}
                    />
                  </Field>
                </div>
              </SettingsCard>

              <SettingsCard
                title={t('codDefaultLabel')}
                description={t('codDefaultHelp')}
                checked={props.assumeCodWhenPaymentMissing}
                switchLabel={t('codDefaultLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onAssumeCodWhenPaymentMissingChange}
              >
                {props.assumeCodWhenPaymentMissing && (
                  <div className="flex gap-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{standaloneT('general.codRiskHelp')}</p>
                  </div>
                )}
              </SettingsCard>
            </section>
          )}

          {selectedSection === 'automation' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {t('automation.heading')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('automation.subtitle')}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {standaloneT('automation.trustTitle')}
                  </p>
                  <p className="text-xs leading-5 text-slate-600">
                    {standaloneT('automation.trustDescription')}
                  </p>
                </div>
              </div>

              <SettingsCard
                title={standaloneT('automation.confirmationTitle')}
                description={t('autoVerifyDescription')}
                checked={props.isAutoVerifyEnabled}
                switchLabel={t('autoVerifyLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onAutoVerifyChange}
              >
                {props.isAutoVerifyEnabled && (
                  <Field label={standaloneT('automation.firstDelayLabel')}>
                    <DelayPicker
                      value={props.sendDelayMinutes}
                      presets={firstDelayPresets}
                      customLabel={standaloneT('delay.custom')}
                      inputLabel={t('automation.sendDelayMinutesLabel')}
                      error={props.sendDelayMinutesError}
                      disabled={fieldsDisabled || !props.isAutoVerifyEnabled}
                      max={24}
                      onChange={props.onSendDelayMinutesChange}
                    />
                  </Field>
                )}
              </SettingsCard>

              <SettingsCard
                title={standaloneT('automation.followUpTitle')}
                description={t('automation.followUpEnabledHelp')}
                checked={props.followUpEnabled}
                switchLabel={t('automation.followUpEnabledLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onFollowUpEnabledChange}
              >
                {props.followUpEnabled && (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
                    <div className="rounded-xl bg-slate-50 px-4 py-5">
                      <div className="relative grid grid-cols-3 text-center">
                        <span className="absolute top-2.5 right-[16.66%] left-[16.66%] h-px bg-slate-300" />
                        {[
                          standaloneT('automation.timeline.received'),
                          standaloneT('automation.timeline.first', {
                            delay: formatDelay(props.sendDelayMinutes),
                          }),
                          standaloneT('automation.timeline.followUp', {
                            delay: formatDelay(props.followUpDelayMinutes),
                          }),
                        ].map((label, index) => (
                          <div key={label} className="relative space-y-2 px-1">
                            <span
                              className={cn(
                                'mx-auto block h-5 w-5 rounded-full border-4 border-slate-50',
                                index === 2 && !props.followUpEnabled
                                  ? 'bg-slate-300'
                                  : 'bg-emerald-500'
                              )}
                            />
                            <p className="text-xs leading-5 text-slate-600">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Field label={t('automation.followUpDelayMinutesLabel')}>
                      <DelayPicker
                        value={props.followUpDelayMinutes}
                        presets={followUpDelayPresets}
                        customLabel={standaloneT('delay.custom')}
                        inputLabel={t('automation.followUpDelayMinutesLabel')}
                        error={props.followUpDelayMinutesError}
                        disabled={fieldsDisabled || !props.followUpEnabled}
                        max={168}
                        onChange={props.onFollowUpDelayMinutesChange}
                      />
                    </Field>
                  </div>
                )}
              </SettingsCard>

              <SettingsCard
                title={standaloneT('automation.reviewTitle')}
                description={t('automation.escalationEnabledHelp')}
                checked={props.escalationEnabled}
                switchLabel={t('automation.escalationEnabledLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onEscalationEnabledChange}
              >
                {props.escalationEnabled && (
                  <div className="space-y-4">
                    <Field label={t('automation.escalationDelayMinutesLabel')}>
                      <DelayPicker
                        value={props.escalationDelayMinutes}
                        presets={escalationDelayPresets}
                        customLabel={standaloneT('delay.custom')}
                        inputLabel={t('automation.escalationDelayMinutesLabel')}
                        error={props.escalationDelayMinutesError}
                        disabled={fieldsDisabled || !props.escalationEnabled}
                        max={168}
                        onChange={props.onEscalationDelayMinutesChange}
                      />
                    </Field>
                    <div className="flex gap-2 text-sm leading-6 text-slate-600">
                      <Info className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                      <p>{props.escalationReviewDescription}</p>
                    </div>
                  </div>
                )}
              </SettingsCard>

              <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <summary className="cursor-pointer px-2 py-1 text-sm font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none">
                  {standaloneT('automation.advancedScheduling')}
                </summary>
                <div className="mt-3">
                  <SettingsCard
                    title={standaloneT('automation.quietHoursTitle')}
                    description={t('automation.quietHoursEnabledHelp')}
                    checked={props.quietHoursEnabled}
                    switchLabel={t('automation.quietHoursEnabledLabel')}
                    switchDisabled={fieldsDisabled}
                    onCheckedChange={props.onQuietHoursEnabledChange}
                  >
                    {props.quietHoursEnabled && (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr]">
                          <Field
                            label={t('automation.quietHoursStartLabel')}
                            error={props.quietHoursError}
                          >
                            <Input
                              type="time"
                              disabled={
                                fieldsDisabled || !props.quietHoursEnabled
                              }
                              value={props.quietHoursStart}
                              onChange={(event) =>
                                props.onQuietHoursStartChange(
                                  event.target.value
                                )
                              }
                            />
                          </Field>
                          <Field label={t('automation.quietHoursEndLabel')}>
                            <Input
                              type="time"
                              disabled={
                                fieldsDisabled || !props.quietHoursEnabled
                              }
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
                              disabled={
                                fieldsDisabled || !props.quietHoursEnabled
                              }
                              onChange={props.onTimezoneChange}
                            />
                          </Field>
                        </div>
                        <div className="flex gap-2 text-sm leading-6 text-slate-600">
                          <Info className="mt-1 h-4 w-4 shrink-0" />
                          <p>
                            {standaloneT('automation.quietHoursResume', {
                              time: props.quietHoursEnd,
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </SettingsCard>
                </div>
              </details>
            </section>
          )}

          {selectedSection === 'billing' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {standaloneT('billing.title')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {standaloneT('billing.description')}
                </p>
              </div>

              <Card className="border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {standaloneT('billing.creditPageTitle')}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {standaloneT('billing.creditPageDescription')}
                    </p>
                  </div>
                  <Button asChild className="shrink-0">
                    <Link href={withLocale('/billing', locale)}>
                      {standaloneT('billing.openCreditPage')}
                    </Link>
                  </Button>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>

      {props.canUpdateConfiguration && props.isDirty && (
        <div className="fixed inset-x-4 bottom-4 z-40 rounded-xl border border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur sm:px-5 lg:start-[280px] lg:end-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {props.saveFailed
                ? standaloneT('saveBar.failedHelp')
                : standaloneT('saveBar.pendingHelp')}
            </p>
            <div className="flex gap-3 sm:shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={props.isSaving}
                onClick={props.onDiscard}
                className="flex-1 sm:flex-none"
              >
                {standaloneT('saveBar.discard')}
              </Button>
              <Button
                type="button"
                disabled={props.isSaving}
                onClick={() => void props.onSave()}
                className="flex-1 sm:flex-none"
              >
                {props.isSaving ? t('savingButton') : t('saveButton')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SettingsStandaloneSkin(
  props: SettingsSkinProps & { view?: 'settings' | 'templates' }
) {
  const t = useTranslations('settings')
  const templateT = useTranslations('messageTemplate.standalone')
  const view = props.view ?? 'settings'

  if (props.isLoadError) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="border-red-200 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {view === 'templates' ? templateT('pageTitle') : t('title')}
          </h1>
          <p className="mt-3 text-sm text-red-700">{t('loadError')}</p>
          <Button className="mt-5" onClick={props.onRetry}>
            {t('retryButton')}
          </Button>
        </Card>
      </div>
    )
  }

  if (view === 'settings') {
    return <StandaloneSettingsExperience props={props} />
  }

  return <TemplatesStandaloneSkin props={props} />
}
