'use client'

import { useId } from 'react'
import { Check, Info, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { AkSwitch, akCard, akPill } from '@/shared/ui'
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
  return (
    <section
      className={cn(akCard, 'space-y-4 px-4 py-4 sm:px-6')}
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id={`${id}-heading`} className="text-ak-section text-ink">
          {t('heading')}
        </h2>
        <span className={akPill({ tone: props.checked ? 'brand' : 'neutral' })}>
          {t(props.checked ? 'on' : 'off')}
        </span>
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
            aria-describedby={`${id}-description ${id}-cost${!available ? ` ${id}-unavailable` : ''}`}
            checked={props.checked}
            disabled={props.readOnly || (!available && !props.checked)}
            onCheckedChange={props.onChange}
          />
        </div>
        <p id={`${id}-description`} className="text-ak-caption text-ink-muted">
          {t('description')}
        </p>
      </div>
      <div className="bg-surface-sunken border-line rounded-ak-control flex items-start gap-2 border px-3 py-2.5">
        <Info
          aria-hidden="true"
          className="text-ink-muted mt-0.5 size-4 shrink-0"
        />
        <p id={`${id}-cost`} className="text-ak-caption text-ink">
          {t('creditCost', { count: props.acknowledgment.creditsPerMessage })}
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
      <div className="border-line space-y-4 border-t pt-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-ak-body text-ink font-semibold">
              {t('examplesHeading')}
            </h3>
            <span className="text-ak-caption text-ink-muted">
              {tLanguages(props.language)}
            </span>
          </div>
          {props.automaticStyle && (
            <p className="text-ak-caption text-ink-muted">{t('autoNote')}</p>
          )}
        </div>
        {(['confirmed', 'canceled'] as const).map((outcome) => (
          <div key={outcome} className="space-y-2">
            <h4 className="text-ak-body text-ink flex items-center gap-2 font-semibold">
              <span
                className={cn(
                  'inline-flex size-5.5 shrink-0 items-center justify-center rounded-full',
                  outcome === 'confirmed'
                    ? 'bg-brand-soft text-brand-ink'
                    : 'bg-neutral-soft text-ink-muted'
                )}
              >
                {outcome === 'confirmed' ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : (
                  <X aria-hidden="true" className="size-3.5" />
                )}
              </span>
              {t(outcome)}
            </h4>
            <p
              className="text-ak-body bg-surface-sunken text-ink border-line rounded-ak-control border px-4 py-3 text-start wrap-anywhere whitespace-pre-wrap"
              dir={
                preview[outcome]
                  ? preview.direction
                  : getLocaleDirection(locale)
              }
              lang={preview[outcome] ? props.language : locale}
            >
              {preview[outcome] ?? t('textUnavailable')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
