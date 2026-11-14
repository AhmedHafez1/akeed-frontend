'use client'

import { useId } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AkSwitch, InfoHint, akCard } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { getLocaleDirection } from '@/shared/lib/locale'
import {
  thankYouPreview,
  type ThankYouMessagesProps,
} from '@/features/settings/domain/thankYouPreview'

export function ThankYouMessagesCard(props: ThankYouMessagesProps) {
  const t = useTranslations('settings.thankYou')
  const tLanguages = useTranslations('settings.embedded.message.languageNames')
  const locale = useLocale()
  const id = useId()
  const preview = thankYouPreview(props)
  if (!props.acknowledgment) return null
  const available = props.acknowledgment.available
  const details = (
    <div className="space-y-3">
      <p>{t('description')}</p>
      <p>
        {t('creditCost', { count: props.acknowledgment.creditsPerMessage })}
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-current/15 pt-3">
        <h3 className="font-semibold">{t('examplesHeading')}</h3>
        <span>{tLanguages(props.language)}</span>
      </div>
      {props.automaticStyle && <p>{t('autoNote')}</p>}
      {(['confirmed', 'canceled'] as const).map((outcome) => (
        <div key={outcome} className="space-y-2">
          <h4 className="font-semibold">{t(outcome)}</h4>
          <p
            className="rounded-control border border-current/15 bg-current/5 px-3 py-2.5 text-start wrap-anywhere whitespace-pre-wrap"
            dir={
              preview[outcome] ? preview.direction : getLocaleDirection(locale)
            }
            lang={preview[outcome] ? props.language : locale}
          >
            {preview[outcome] ?? t('textUnavailable')}
          </p>
        </div>
      ))}
    </div>
  )
  return (
    <section
      className={cn(akCard, 'space-y-3 px-4 py-4 sm:px-6')}
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex items-center gap-1">
        <h2 id={`${id}-heading`} className="text-ak-section text-ink">
          {t('heading')}
        </h2>
        <InfoHint label={t('heading')} content={details} rich />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            id={`${id}-label`}
            htmlFor={`${id}-switch`}
            className="text-ak-body text-ink font-medium"
          >
            {t('label')}
          </label>
          <AkSwitch
            id={`${id}-switch`}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-description${!available ? ` ${id}-unavailable` : ''}`}
            checked={props.checked}
            disabled={props.readOnly || (!available && !props.checked)}
            onCheckedChange={props.onChange}
          />
        </div>
        <p id={`${id}-description`} className="sr-only">
          {t('description')}
        </p>
      </div>
      {!available && (
        <p
          id={`${id}-unavailable`}
          role="status"
          className="text-ak-caption bg-ak-warning-soft text-ak-warning border-ak-warning-line rounded-ak-control border px-3 py-2.5"
        >
          {t('unavailable')}
        </p>
      )}
    </section>
  )
}
