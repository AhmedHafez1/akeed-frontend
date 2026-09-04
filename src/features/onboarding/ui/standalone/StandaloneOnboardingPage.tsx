'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type {
  AutomationTimezone,
  IntegrationOnboardingLanguage,
  StandaloneSetupBlockedReason,
} from '@/features/onboarding/domain/onboarding.types'
import { useStandaloneOnboarding } from '@/features/onboarding/hooks/useStandaloneOnboarding'
import { Button, Card, Input, Label } from '@/shared/ui'
import { FullPageLoader } from '@/shared/layout/FullPageLoader'

const timezones: AutomationTimezone[] = [
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

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
    </label>
  )
}

function ErrorText({ children }: { children?: string }) {
  return children ? (
    <p className="mt-1 text-xs font-medium text-red-600">{children}</p>
  ) : null
}

export function StandaloneOnboardingPage() {
  const t = useTranslations('standaloneOnboarding')
  const settingsT = useTranslations('settings')
  const onboarding = useStandaloneOnboarding()
  const [copied, setCopied] = useState(false)

  if (onboarding.isLoading) return <FullPageLoader />

  if (!onboarding.state) {
    const code = onboarding.loadErrorCode ?? 'UNAVAILABLE'
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
        <Card className="w-full border-red-200 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {t('loadErrorTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {code === 'ONBOARDING_SOURCE_MISSING'
              ? t('sourceMissing')
              : code === 'ONBOARDING_SOURCE_INACTIVE'
                ? t('sourceInactive')
                : code === 'ONBOARDING_SOURCE_AMBIGUOUS'
                  ? t('sourceAmbiguous')
                  : t('loadError')}
          </p>
          <Button className="mt-5" onClick={() => void onboarding.retry()}>
            {t('retry')}
          </Button>
        </Card>
      </main>
    )
  }

  const disabled = !onboarding.canManage
  const blockerLabel = (reason: StandaloneSetupBlockedReason) =>
    t(`blockers.${reason}`)

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      {!onboarding.canManage && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {t('readOnly')}
        </div>
      )}
      {onboarding.errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {onboarding.errorMessage}
        </div>
      )}
      {onboarding.successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {onboarding.successMessage}
        </div>
      )}

      <Card className="border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('sourceHeading')}
        </h2>
        <p className="mt-2 text-sm font-medium text-emerald-700">
          {t('sourceType')}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <code
            dir="ltr"
            className="min-w-0 flex-1 text-xs break-all text-slate-700"
          >
            {onboarding.state.source.identity}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(
                onboarding.state?.source.identity ?? ''
              )
              setCopied(true)
            }}
          >
            {copied ? t('copied') : t('copy')}
          </Button>
        </div>
      </Card>

      <Card className="space-y-5 border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('configurationHeading')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="standalone-merchant-name">
              {t('merchantName')}
            </Label>
            <Input
              id="standalone-merchant-name"
              className="mt-2"
              value={onboarding.form.storeName}
              disabled={disabled}
              onChange={(event) =>
                onboarding.setField('storeName', event.target.value)
              }
            />
            <ErrorText>{onboarding.fieldErrors.storeName}</ErrorText>
          </div>
          <div>
            <Label htmlFor="standalone-language">{t('language')}</Label>
            <select
              id="standalone-language"
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3"
              value={onboarding.form.defaultLanguage}
              disabled={disabled}
              onChange={(event) =>
                onboarding.setField(
                  'defaultLanguage',
                  event.target.value as IntegrationOnboardingLanguage
                )
              }
            >
              <option value="auto">{settingsT('languageAuto')}</option>
              <option value="en">{settingsT('languageEnglish')}</option>
              <option value="ar">{settingsT('languageArabic')}</option>
            </select>
          </div>
        </div>

        <Toggle
          label={t('codDefault')}
          description={t('codDefaultHelp')}
          checked={onboarding.form.assumeCodWhenPaymentMissing}
          disabled={disabled}
          onChange={(value) =>
            onboarding.setField('assumeCodWhenPaymentMissing', value)
          }
        />
        <Toggle
          label={settingsT('autoVerifyLabel')}
          description={settingsT('autoVerifyDescription')}
          checked={onboarding.form.isAutoVerifyEnabled}
          disabled={disabled}
          onChange={(value) =>
            onboarding.setField('isAutoVerifyEnabled', value)
          }
        />

        <div>
          <Label htmlFor="standalone-timezone">{t('timezone')}</Label>
          <select
            id="standalone-timezone"
            className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3"
            value={onboarding.form.timezone}
            disabled={disabled}
            onChange={(event) =>
              onboarding.setField(
                'timezone',
                event.target.value as AutomationTimezone
              )
            }
          >
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {settingsT(
                  `automation.timezones.${timezone.replaceAll('/', '_')}`
                )}
              </option>
            ))}
          </select>
        </div>

        <details className="rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            {t('advanced')}
          </summary>
          <div className="mt-5 space-y-4">
            <div>
              <Label>{settingsT('automation.sendDelayMinutesLabel')}</Label>
              <Input
                className="mt-2"
                type="number"
                min={0}
                max={24}
                step={0.25}
                disabled={disabled}
                value={onboarding.form.sendDelayHours}
                onChange={(event) =>
                  onboarding.setField('sendDelayHours', event.target.value)
                }
              />
              <ErrorText>{onboarding.fieldErrors.sendDelayHours}</ErrorText>
            </div>
            <Toggle
              label={settingsT('automation.followUpEnabledLabel')}
              description={settingsT('automation.followUpEnabledHelp')}
              checked={onboarding.form.followUpEnabled}
              disabled={disabled}
              onChange={(value) =>
                onboarding.setField('followUpEnabled', value)
              }
            />
            <Input
              type="number"
              min={0}
              max={168}
              step={0.25}
              disabled={disabled || !onboarding.form.followUpEnabled}
              value={onboarding.form.followUpDelayHours}
              onChange={(event) =>
                onboarding.setField('followUpDelayHours', event.target.value)
              }
            />
            <ErrorText>{onboarding.fieldErrors.followUpDelayHours}</ErrorText>
            <Toggle
              label={settingsT('automation.escalationEnabledLabel')}
              description={settingsT('automation.escalationEnabledHelp')}
              checked={onboarding.form.escalationEnabled}
              disabled={disabled}
              onChange={(value) =>
                onboarding.setField('escalationEnabled', value)
              }
            />
            <Input
              type="number"
              min={0}
              max={168}
              step={0.25}
              disabled={disabled || !onboarding.form.escalationEnabled}
              value={onboarding.form.escalationDelayHours}
              onChange={(event) =>
                onboarding.setField('escalationDelayHours', event.target.value)
              }
            />
            <ErrorText>{onboarding.fieldErrors.escalationDelayHours}</ErrorText>
            <Toggle
              label={settingsT('automation.quietHoursEnabledLabel')}
              description={settingsT('automation.quietHoursEnabledHelp')}
              checked={onboarding.form.quietHoursEnabled}
              disabled={disabled}
              onChange={(value) =>
                onboarding.setField('quietHoursEnabled', value)
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="time"
                disabled={disabled || !onboarding.form.quietHoursEnabled}
                value={onboarding.form.quietHoursStart}
                onChange={(event) =>
                  onboarding.setField('quietHoursStart', event.target.value)
                }
              />
              <Input
                type="time"
                disabled={disabled || !onboarding.form.quietHoursEnabled}
                value={onboarding.form.quietHoursEnd}
                onChange={(event) =>
                  onboarding.setField('quietHoursEnd', event.target.value)
                }
              />
            </div>
            <ErrorText>{onboarding.fieldErrors.quietHours}</ErrorText>
          </div>
        </details>
      </Card>

      {onboarding.blockedReasons.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            {t('blockedHeading')}
          </h2>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-amber-800">
            {onboarding.blockedReasons.map((reason) => (
              <li key={reason}>{blockerLabel(reason)}</li>
            ))}
          </ul>
        </Card>
      )}

      {onboarding.canManage && (
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={
              disabled || onboarding.isSaving || onboarding.isCompleting
            }
            onClick={() => void onboarding.save()}
          >
            {onboarding.isSaving ? t('saving') : t('saveProgress')}
          </Button>
          <Button
            type="button"
            disabled={
              disabled || onboarding.isSaving || onboarding.isCompleting
            }
            onClick={() => void onboarding.complete()}
          >
            {onboarding.isCompleting ? t('completing') : t('complete')}
          </Button>
        </div>
      )}
      <p className="text-center text-xs text-slate-500">{t('metaNotice')}</p>
    </main>
  )
}
