'use client'

import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'
import type {
  StandaloneSetupBlockedReason,
  StandaloneStep,
} from '@/features/onboarding/domain/onboarding.types'
import type { StandaloneSetupForm } from '@/features/onboarding/hooks/useStandaloneOnboarding'
import { BlockedReasonsPanel, SummaryRow } from '../components'

interface ReviewStepProps {
  form: StandaloneSetupForm
  blockedReasons: readonly StandaloneSetupBlockedReason[]
  onEdit: (step: StandaloneStep) => void
}

export function ReviewStep({ form, blockedReasons, onEdit }: ReviewStepProps) {
  const t = useTranslations('standaloneOnboarding')
  const settingsT = useTranslations('settings')

  const languageLabel =
    form.defaultLanguage === 'ar'
      ? settingsT('languageArabic')
      : form.defaultLanguage === 'en'
        ? settingsT('languageEnglish')
        : settingsT('languageAuto')

  const timezoneLabel = settingsT(
    `automation.timezones.${form.timezone.replaceAll('/', '_')}`
  )

  // Only rules that are actually enabled are listed, so the summary never
  // implies behaviour that is switched off.
  const timingRules: string[] = []
  if (form.isAutoVerifyEnabled) {
    const sendHours = Number.parseFloat(form.sendDelayHours)
    timingRules.push(
      Number.isFinite(sendHours) && sendHours === 0
        ? t('review.firstDelayImmediate')
        : t('review.firstDelay', { hours: form.sendDelayHours })
    )
    if (form.followUpEnabled) {
      timingRules.push(t('review.followUp', { hours: form.followUpDelayHours }))
    }
    if (form.escalationEnabled) {
      timingRules.push(
        t('review.escalation', { hours: form.escalationDelayHours })
      )
    }
    if (form.quietHoursEnabled) {
      timingRules.push(
        t('review.quietHours', {
          start: form.quietHoursStart,
          end: form.quietHoursEnd,
        })
      )
    }
  }

  return (
    <div className="space-y-6">
      <dl className="rounded-xl border border-slate-200 bg-white px-4 py-1 sm:px-5">
        <SummaryRow
          label={t('review.storeName')}
          value={form.storeName}
          editStep={1}
          editStepTitle={t('steps.storeDetails.title')}
          onEdit={onEdit}
        />
        <SummaryRow
          label={t('review.language')}
          value={languageLabel}
          editStep={1}
          editStepTitle={t('steps.storeDetails.title')}
          onEdit={onEdit}
        />
        <SummaryRow label={t('review.source')} value={t('sourceType')} />
        <SummaryRow
          label={t('review.cod')}
          value={
            form.assumeCodWhenPaymentMissing
              ? t('review.codOn')
              : t('review.codOff')
          }
          editStep={1}
          editStepTitle={t('steps.storeDetails.title')}
          onEdit={onEdit}
        />
        <SummaryRow
          label={t('review.automation')}
          value={
            form.isAutoVerifyEnabled
              ? t('review.on')
              : t('review.automationOff')
          }
          editStep={2}
          editStepTitle={t('steps.confirmationRules.title')}
          onEdit={onEdit}
        />
        <SummaryRow
          label={t('review.timezone')}
          value={<bdi>{timezoneLabel}</bdi>}
          editStep={2}
          editStepTitle={t('steps.confirmationRules.title')}
          onEdit={onEdit}
        />
        <SummaryRow
          label={t('review.timing')}
          value={
            timingRules.length > 0 ? (
              <ul className="space-y-0.5">
                {timingRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            ) : (
              t('review.noTimingRules')
            )
          }
          editStep={2}
          editStepTitle={t('steps.confirmationRules.title')}
          onEdit={onEdit}
        />
      </dl>

      <BlockedReasonsPanel reasons={blockedReasons} />

      <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-3 text-start text-xs leading-5 text-slate-600">
        <ShieldCheck
          aria-hidden="true"
          className="mt-px h-4 w-4 shrink-0 text-slate-400"
        />
        {t('metaNotice')}
      </p>
    </div>
  )
}
