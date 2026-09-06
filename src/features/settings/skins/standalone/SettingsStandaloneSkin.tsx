'use client'

import { useId, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  CheckCircle2,
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
  ArabicCodTemplateVariantId,
  AutomationTimezone,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import {
  formatTemplatePreviewTimestamp,
  getTemplatePreviewParagraphs,
} from '@/features/settings/skins/shared/templatePreview'
import { Button, Card, Input, Label } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

const SUBSCRIPTION_SECTION_ID = 'subscription-usage'
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

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id?: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card
      id={id}
      className="scroll-mt-20 border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </Card>
  )
}

function StandaloneUsageOverview({
  used,
  limit,
  usedLabel,
  limitLabel,
  upgradePrompt,
}: {
  used: number
  limit: number
  usedLabel: string
  limitLabel: string
  upgradePrompt: string | null
}) {
  const safeLimit = Math.max(limit, 1)
  const usagePercent = Math.min(100, Math.round((used / safeLimit) * 100))

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-900">
          {used} / {limit}
        </span>
        <span className="text-slate-500">{limitLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{usedLabel}</p>
      {upgradePrompt && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {upgradePrompt}
        </p>
      )}
    </div>
  )
}

function StandalonePlanComparison({
  plans,
  currentPlanId,
  selectedPlanId,
  disabledPlanIds = [],
  disabledPlanTooltips = {},
  currentBadgeLabel,
  onPlanSelect,
}: {
  plans: SettingsSkinProps['planOptions']
  currentPlanId: OnboardingBillingPlanId | null
  selectedPlanId: OnboardingBillingPlanId | null
  disabledPlanIds?: OnboardingBillingPlanId[]
  disabledPlanTooltips?: Partial<Record<OnboardingBillingPlanId, string>>
  currentBadgeLabel: string
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId
        const isDisabled = disabledPlanIds.includes(plan.id) && !isCurrent
        const isSelected = plan.id === selectedPlanId && !isDisabled

        return (
          <button
            key={plan.id}
            type="button"
            disabled={isDisabled}
            title={isDisabled ? disabledPlanTooltips[plan.id] : undefined}
            onClick={() => onPlanSelect(plan.id)}
            className={`rounded-2xl border p-4 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex min-h-12 flex-col items-center justify-start gap-1">
              <p className="font-semibold text-slate-900">{plan.name}</p>
              {isCurrent && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {currentBadgeLabel}
                </span>
              )}
            </div>
            <p
              dir="auto"
              className="mt-3 text-xl leading-7 font-bold text-slate-900 [unicode-bidi:isolate]"
            >
              {plan.priceLabel}
            </p>
            <p
              dir="auto"
              className="mx-auto mt-2 max-w-40 text-sm text-slate-500 [unicode-bidi:isolate]"
            >
              {plan.volumeLabel}
            </p>
          </button>
        )
      })}
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

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
    >
      <CheckCircle2 className="h-4 w-4" />
      {props.successBanner ? t('saveState.saved') : t('saveState.allSaved')}
    </span>
  )
}

function StandaloneSettingsExperience({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings')
  const standaloneT = useTranslations('settings.standalone')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedSection = searchParams.get(SETTINGS_SECTION_QUERY_KEY)
  const selectedSection: SettingsSection = SETTINGS_SECTIONS.includes(
    requestedSection as SettingsSection
  )
    ? (requestedSection as SettingsSection)
    : 'general'
  const canChangePlan =
    props.canManageBilling &&
    props.selectedPlanId !== null &&
    props.selectedPlanId !== props.billingPlanId
  const fieldsDisabled = !props.canUpdateConfiguration || props.isSaving

  const navigateToSection = (section: SettingsSection) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set(SETTINGS_SECTION_QUERY_KEY, section)
    router.push(`${pathname}?${nextParams.toString()}`, { scroll: false })
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
    {
      id: 'billing' as const,
      label: standaloneT('nav.billing'),
      icon: CircleDollarSign,
    },
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

      <div className="grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 md:sticky md:top-24">
          <nav
            aria-label={standaloneT('nav.label')}
            className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 md:overflow-visible md:p-3"
          >
            <div className="flex min-w-max gap-1 md:min-w-0 md:flex-col">
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
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none md:w-full',
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {props.sourcePlatformType === 'standalone'
                      ? t('sourceStandalone')
                      : props.sourcePlatformType}
                  </div>
                  <code
                    dir="ltr"
                    className="max-w-full rounded-lg bg-slate-50 px-3 py-2 text-xs break-all text-slate-600"
                  >
                    {props.sourceIdentity}
                  </code>
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
                <div className="flex gap-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{standaloneT('general.codRiskHelp')}</p>
                </div>
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

              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
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
              </SettingsCard>

              <SettingsCard
                title={standaloneT('automation.followUpTitle')}
                description={t('automation.followUpEnabledHelp')}
                checked={props.followUpEnabled}
                switchLabel={t('automation.followUpEnabledLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onFollowUpEnabledChange}
              >
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
              </SettingsCard>

              <SettingsCard
                title={standaloneT('automation.reviewTitle')}
                description={t('automation.escalationEnabledHelp')}
                checked={props.escalationEnabled}
                switchLabel={t('automation.escalationEnabledLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onEscalationEnabledChange}
              >
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
              </SettingsCard>

              <SettingsCard
                title={standaloneT('automation.quietHoursTitle')}
                description={t('automation.quietHoursEnabledHelp')}
                checked={props.quietHoursEnabled}
                switchLabel={t('automation.quietHoursEnabledLabel')}
                switchDisabled={fieldsDisabled}
                onCheckedChange={props.onQuietHoursEnabledChange}
              >
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr]">
                    <Field
                      label={t('automation.quietHoursStartLabel')}
                      error={props.quietHoursError}
                    >
                      <Input
                        type="time"
                        disabled={fieldsDisabled || !props.quietHoursEnabled}
                        value={props.quietHoursStart}
                        onChange={(event) =>
                          props.onQuietHoursStartChange(event.target.value)
                        }
                      />
                    </Field>
                    <Field label={t('automation.quietHoursEndLabel')}>
                      <Input
                        type="time"
                        disabled={fieldsDisabled || !props.quietHoursEnabled}
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
                        disabled={fieldsDisabled || !props.quietHoursEnabled}
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
              </SettingsCard>
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

              <SettingsCard
                title={
                  props.sourcePlatformType === 'standalone'
                    ? t('pilotAccessHeading')
                    : t('subscriptionHeading')
                }
                description={props.billingStatusLabel}
              >
                <div id={SUBSCRIPTION_SECTION_ID} className="space-y-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-700">
                      {props.activePlanName
                        ? t('subscriptionCurrentPlan', {
                            plan: props.activePlanName,
                          })
                        : t('subscriptionNoPlan')}
                    </p>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      {props.billingStatusLabel}
                    </span>
                  </div>

                  {props.usageData && (
                    <StandaloneUsageOverview
                      used={props.usageData.used}
                      limit={props.usageData.limit}
                      usedLabel={props.usageData.usedLabel}
                      limitLabel={props.usageData.limitLabel}
                      upgradePrompt={props.usageData.upgradePrompt}
                    />
                  )}
                </div>
              </SettingsCard>

              {props.canManageBilling && (
                <SettingsCard
                  title={standaloneT('billing.plansTitle')}
                  description={standaloneT('billing.plansDescription')}
                >
                  <div className="space-y-5">
                    <StandalonePlanComparison
                      plans={props.planOptions}
                      currentPlanId={props.billingPlanId}
                      selectedPlanId={props.selectedPlanId}
                      disabledPlanIds={
                        props.isFreePlanClaimed ? ['starter'] : []
                      }
                      disabledPlanTooltips={
                        props.isFreePlanClaimed
                          ? { starter: t('freePlanAlreadyClaimedTooltip') }
                          : undefined
                      }
                      currentBadgeLabel={t('currentPlanBadge')}
                      onPlanSelect={props.onPlanSelect}
                    />
                    {canChangePlan && (
                      <Button
                        type="button"
                        disabled={props.isChangingPlan}
                        onClick={() => void props.onChangePlan()}
                      >
                        {props.isChangingPlan
                          ? t('changingPlanButton')
                          : t('changePlanButton')}
                      </Button>
                    )}
                  </div>
                </SettingsCard>
              )}
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
  const previewT = useTranslations('messageTemplate')
  const view = props.view ?? 'settings'
  const initialLanguage =
    props.defaultLanguage === 'ar' || props.defaultLanguage === 'en'
      ? props.defaultLanguage
      : props.defaultTemplateLanguage
  const [previewLanguage, setPreviewLanguage] = useState<'ar' | 'en'>(
    initialLanguage
  )
  const selectedVariant =
    previewLanguage === 'ar'
      ? props.selectedCodTemplateVariants.ar
      : props.selectedCodTemplateVariants.en
  const availableVariants = props.codTemplateVariants[previewLanguage]
  const selectedDefinition = availableVariants.find(
    (variant) => variant.variant === selectedVariant
  )
  const template =
    selectedDefinition?.preview ?? props.templatePreviews[previewLanguage]
  const previewParagraphs = getTemplatePreviewParagraphs(
    template,
    props.storeName
  )
  const variantOptions = availableVariants.map((variant) => ({
    label: previewT(`variantLabels.${variant.variant}`),
    value: variant.variant,
  }))
  const defaultVariant = props.codTemplateDefaults[previewLanguage]
  const isDefaultVariant = selectedVariant === defaultVariant
  const isStoreLanguageAuto = props.defaultLanguage === 'auto'
  const storeLanguageLabel =
    props.defaultLanguage === 'ar'
      ? previewT('languageArabic')
      : props.defaultLanguage === 'en'
        ? previewT('languageEnglish')
        : previewT('languageAuto')
  const languageContext = isStoreLanguageAuto
    ? previewT('storeLanguageAutoHint')
    : previewT('storeLanguageFixedHint', { language: storeLanguageLabel })

  const handleVariantChange = (value: string) => {
    if (previewLanguage === 'ar') {
      props.onCodTemplateArVariantChange(value as ArabicCodTemplateVariantId)
      return
    }

    props.onCodTemplateEnVariantChange(value as EnglishCodTemplateVariantId)
  }

  if (props.isLoadError) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="border-red-200 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {view === 'templates' ? previewT('pageTitle') : t('title')}
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {view === 'templates' ? previewT('pageTitle') : t('title')}
          </h1>
          <p className="text-sm text-slate-500">
            {view === 'templates' ? previewT('pageSubtitle') : t('subtitle')}
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

      {view === 'templates' && (
        <SectionCard
          title={previewT('setupTitle')}
          description={previewT('setupDescription')}
        >
          <div className="space-y-5">
            <p className="text-sm text-slate-500">{languageContext}</p>

            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Field label={previewT('languageLabel')}>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
                    {props.templateLanguages.includes('ar') && (
                      <Button
                        type="button"
                        variant={previewLanguage === 'ar' ? 'default' : 'ghost'}
                        size="sm"
                        disabled={!props.canUpdateConfiguration}
                        onClick={() => setPreviewLanguage('ar')}
                      >
                        {previewT('languageArabic')}
                      </Button>
                    )}
                    {props.templateLanguages.includes('en') && (
                      <Button
                        type="button"
                        variant={previewLanguage === 'en' ? 'default' : 'ghost'}
                        size="sm"
                        disabled={!props.canUpdateConfiguration}
                        onClick={() => setPreviewLanguage('en')}
                      >
                        {previewT('languageEnglish')}
                      </Button>
                    )}
                  </div>
                </Field>

                <Field label={previewT('styleLabel')}>
                  <NativeSelect
                    value={selectedVariant}
                    options={variantOptions}
                    disabled={!props.canUpdateConfiguration}
                    onChange={handleVariantChange}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    {previewT('defaultVariantLabel', {
                      variant: previewT(`variantLabels.${defaultVariant}`),
                    })}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {isDefaultVariant
                      ? previewT('badgeDefault')
                      : previewT('badgeCustom')}
                  </p>
                </Field>
                <p className="text-xs text-slate-500">
                  {previewT('perLanguageStyleHint')}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  {previewT('previewDescription')}
                </p>
                <div className="mx-auto w-full max-w-[380px] rounded-2xl border border-[#d8d8d8] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center p-3 shadow-sm">
                  <div
                    dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
                    style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
                    className="overflow-hidden rounded-xl border border-[#e7e7e7] bg-white text-[#1e1f21]"
                  >
                    <div className="space-y-5 px-4 pt-4 pb-3 text-[15px] leading-6 font-normal">
                      {previewParagraphs.map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                    <div
                      className={`px-4 pb-2 text-[14px] text-[#8e8e93] ${
                        previewLanguage === 'ar' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {formatTemplatePreviewTimestamp(previewLanguage)}
                    </div>
                    <div
                      className={`border-t border-[#ececec] px-4 py-3 text-[#178959] ${
                        previewLanguage === 'ar' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center gap-2 text-[15px] leading-6 font-normal ${
                          previewLanguage === 'ar'
                            ? 'flex-row-reverse'
                            : 'flex-row'
                        }`}
                      >
                        <span className="text-[13px]">↩</span>
                        {template.confirmButton}
                      </span>
                    </div>
                    <div
                      className={`border-t border-[#ececec] px-4 py-3 text-[#178959] ${
                        previewLanguage === 'ar' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center gap-2 text-[15px] leading-6 font-normal ${
                          previewLanguage === 'ar'
                            ? 'flex-row-reverse'
                            : 'flex-row'
                        }`}
                      >
                        <span className="text-[13px]">↩</span>
                        {template.cancelButton}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
