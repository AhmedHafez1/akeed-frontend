'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import type {
  AutomationTimezone,
  StandaloneSetupFieldErrors,
} from '@/features/onboarding/domain/onboarding.types'
import type { StandaloneSetupForm } from '@/features/onboarding/hooks/useStandaloneOnboarding'
import { STANDALONE_FIELD_IDS } from '@/features/onboarding/model/onboarding.steps'
import { Input } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  NativeSelect,
  NumericHoursInput,
  OnboardingCard,
  OnboardingField,
} from '../components'

const TIMEZONES: readonly AutomationTimezone[] = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Qatar',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Muscat',
  'Asia/Amman',
  'Africa/Cairo',
  'Africa/Casablanca',
  'UTC',
]

interface ConfirmationRulesStepProps {
  form: StandaloneSetupForm
  fieldErrors: StandaloneSetupFieldErrors
  disabled: boolean
  onFieldChange: <TKey extends keyof StandaloneSetupForm>(
    key: TKey,
    value: StandaloneSetupForm[TKey]
  ) => void
}

export function ConfirmationRulesStep({
  form,
  fieldErrors,
  disabled,
  onFieldChange,
}: ConfirmationRulesStepProps) {
  const t = useTranslations('standaloneOnboarding')
  const settingsT = useTranslations('settings')
  const { isRTL } = useLocaleInfo()

  // Advanced timing starts collapsed, but never hides an enabled rule or an
  // error the user has to act on.
  const mustShowAdvanced =
    form.quietHoursEnabled || fieldErrors.quietHours !== undefined
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(mustShowAdvanced)
  const showAdvanced = isAdvancedOpen || mustShowAdvanced

  const automationOff = !form.isAutoVerifyEnabled
  const timingDisabled = disabled || automationOff

  const timezoneOptions = TIMEZONES.map((timezone) => ({
    value: timezone,
    label: settingsT(`automation.timezones.${timezone.replaceAll('/', '_')}`),
  }))

  return (
    <div className="space-y-4">
      <OnboardingCard
        title={t('rules.autoVerifyHeading')}
        description={t('rules.autoVerifyHelp')}
        checked={form.isAutoVerifyEnabled}
        switchLabel={t('rules.autoVerifyHeading')}
        switchDisabled={disabled}
        onCheckedChange={(value) => onFieldChange('isAutoVerifyEnabled', value)}
      >
        <OnboardingField
          htmlFor="onboarding-timezone"
          label={settingsT('automation.timezoneLabel')}
          helpText={t('rules.timezoneHelp')}
        >
          {({ describedBy }) => (
            <NativeSelect
              id="onboarding-timezone"
              value={form.timezone}
              options={timezoneOptions}
              disabled={disabled}
              describedBy={describedBy}
              onChange={(value) => onFieldChange('timezone', value)}
            />
          )}
        </OnboardingField>
      </OnboardingCard>

      {automationOff && (
        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-start text-xs leading-5 text-slate-600">
          {t('rules.disabledHint')}
        </p>
      )}

      <OnboardingCard
        title={t('rules.firstDelayHeading')}
        description={t('rules.firstDelayHelp')}
      >
        <OnboardingField
          htmlFor={STANDALONE_FIELD_IDS.sendDelayHours}
          label={settingsT('automation.sendDelayMinutesLabel')}
          error={fieldErrors.sendDelayHours}
        >
          {({ describedBy }) => (
            <NumericHoursInput
              id={STANDALONE_FIELD_IDS.sendDelayHours}
              value={form.sendDelayHours}
              max={24}
              disabled={timingDisabled}
              invalid={fieldErrors.sendDelayHours !== undefined}
              describedBy={describedBy}
              onChange={(value) => onFieldChange('sendDelayHours', value)}
            />
          )}
        </OnboardingField>
      </OnboardingCard>

      <OnboardingCard
        title={t('rules.followUpHeading')}
        description={t('rules.followUpHelp')}
        checked={form.followUpEnabled}
        switchLabel={t('rules.followUpHeading')}
        switchDisabled={timingDisabled}
        onCheckedChange={(value) => onFieldChange('followUpEnabled', value)}
      >
        <OnboardingField
          htmlFor={STANDALONE_FIELD_IDS.followUpDelayHours}
          label={settingsT('automation.followUpDelayMinutesLabel')}
          error={fieldErrors.followUpDelayHours}
        >
          {({ describedBy }) => (
            <NumericHoursInput
              id={STANDALONE_FIELD_IDS.followUpDelayHours}
              value={form.followUpDelayHours}
              max={168}
              disabled={timingDisabled || !form.followUpEnabled}
              invalid={fieldErrors.followUpDelayHours !== undefined}
              describedBy={describedBy}
              onChange={(value) => onFieldChange('followUpDelayHours', value)}
            />
          )}
        </OnboardingField>
      </OnboardingCard>

      <OnboardingCard
        title={t('rules.escalationHeading')}
        description={t('rules.escalationHelp')}
        checked={form.escalationEnabled}
        switchLabel={t('rules.escalationHeading')}
        switchDisabled={timingDisabled}
        onCheckedChange={(value) => onFieldChange('escalationEnabled', value)}
      >
        <OnboardingField
          htmlFor={STANDALONE_FIELD_IDS.escalationDelayHours}
          label={settingsT('automation.escalationDelayMinutesLabel')}
          helpText={settingsT('automation.escalationDelayMinutesHelp')}
          error={fieldErrors.escalationDelayHours}
        >
          {({ describedBy }) => (
            <NumericHoursInput
              id={STANDALONE_FIELD_IDS.escalationDelayHours}
              value={form.escalationDelayHours}
              max={168}
              disabled={timingDisabled || !form.escalationEnabled}
              invalid={fieldErrors.escalationDelayHours !== undefined}
              describedBy={describedBy}
              onChange={(value) => onFieldChange('escalationDelayHours', value)}
            />
          )}
        </OnboardingField>
      </OnboardingCard>

      <div className="rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          aria-expanded={showAdvanced}
          aria-controls="onboarding-advanced-timing"
          onClick={() => setIsAdvancedOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 p-4 text-start focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-5"
        >
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              {t('rules.advanced')}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {form.quietHoursEnabled
                ? t('review.quietHours', {
                    start: form.quietHoursStart,
                    end: form.quietHoursEnd,
                  })
                : t('rules.quietHoursHelp')}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-5 w-5 shrink-0 text-slate-500 transition-transform',
              showAdvanced && 'rotate-180'
            )}
          />
        </button>
        {showAdvanced && (
          <div
            id="onboarding-advanced-timing"
            className="border-t border-slate-200 p-4 text-start sm:p-5"
          >
            <OnboardingCard
              title={t('rules.quietHoursHeading')}
              description={settingsT('automation.quietHoursEnabledHelp')}
              checked={form.quietHoursEnabled}
              switchLabel={t('rules.quietHoursHeading')}
              switchDisabled={timingDisabled}
              onCheckedChange={(value) =>
                onFieldChange('quietHoursEnabled', value)
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <OnboardingField
                  htmlFor={STANDALONE_FIELD_IDS.quietHours}
                  label={settingsT('automation.quietHoursStartLabel')}
                >
                  {({ describedBy }) => (
                    <Input
                      id={STANDALONE_FIELD_IDS.quietHours}
                      type="time"
                      dir="ltr"
                      disabled={timingDisabled || !form.quietHoursEnabled}
                      value={form.quietHoursStart}
                      aria-invalid={fieldErrors.quietHours ? true : undefined}
                      aria-describedby={describedBy}
                      onChange={(event) =>
                        onFieldChange('quietHoursStart', event.target.value)
                      }
                      className={cn(
                        'tabular-nums',
                        isRTL ? 'text-right' : 'text-left',
                        fieldErrors.quietHours &&
                          'border-red-400 focus:border-red-500'
                      )}
                    />
                  )}
                </OnboardingField>
                <OnboardingField
                  htmlFor="onboarding-quiet-hours-end"
                  label={settingsT('automation.quietHoursEndLabel')}
                >
                  {({ describedBy }) => (
                    <Input
                      id="onboarding-quiet-hours-end"
                      type="time"
                      dir="ltr"
                      disabled={timingDisabled || !form.quietHoursEnabled}
                      value={form.quietHoursEnd}
                      aria-invalid={fieldErrors.quietHours ? true : undefined}
                      aria-describedby={describedBy}
                      onChange={(event) =>
                        onFieldChange('quietHoursEnd', event.target.value)
                      }
                      className={cn(
                        'tabular-nums',
                        isRTL ? 'text-right' : 'text-left',
                        fieldErrors.quietHours &&
                          'border-red-400 focus:border-red-500'
                      )}
                    />
                  )}
                </OnboardingField>
              </div>
              {fieldErrors.quietHours && (
                <p className="mt-3 text-xs font-medium text-red-600">
                  {fieldErrors.quietHours}
                </p>
              )}
            </OnboardingCard>
          </div>
        )}
      </div>
    </div>
  )
}
