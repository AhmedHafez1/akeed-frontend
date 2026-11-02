'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { AkSwitch, akCard } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import {
  thankYouPreview,
  type ThankYouMessagesProps,
} from '@/features/settings/domain/thankYouPreview'

export function ThankYouMessagesCard(props: ThankYouMessagesProps) {
  const t = useTranslations('settings.thankYou')
  const id = useId()
  const preview = thankYouPreview(props)
  if (!props.acknowledgment) return null
  const available = props.acknowledgment.available
  return (
    <section
      className={cn(akCard, 'space-y-4 px-4 py-4 sm:px-6')}
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="text-ak-section text-ink">
        {t('heading')}
      </h2>
      <div className="flex items-center justify-between gap-4">
        <label
          id={`${id}-label`}
          htmlFor={`${id}-switch`}
          className="text-ak-body text-ink"
        >
          {t('label')}
        </label>
        <AkSwitch
          id={`${id}-switch`}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-cost`}
          checked={props.checked}
          disabled={props.readOnly || (!available && !props.checked)}
          onCheckedChange={props.onChange}
        />
      </div>
      <p className="text-ak-caption text-ink-muted">{t('description')}</p>
      <p id={`${id}-cost`} className="text-ak-body text-ink font-medium">
        {t('creditCost', { count: props.acknowledgment.creditsPerMessage })}
      </p>
      {!available && (
        <p role="status" className="text-ak-caption text-ink-muted">
          {t('unavailable')}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {(['confirmed', 'canceled'] as const).map((outcome) => (
          <div key={outcome} className="space-y-2">
            <h3 className="text-ak-label text-ink-muted">{t(outcome)}</h3>
            <p
              className="text-ak-body bg-surface-sunken text-ink rounded-ak-control p-3 whitespace-pre-wrap"
              dir={preview.direction}
              lang={props.language}
            >
              {preview[outcome] ?? t('textUnavailable')}
            </p>
          </div>
        ))}
      </div>
      <p className="text-ak-caption text-ink-muted">{t('previewNote')}</p>
      {props.automaticStyle && (
        <p className="text-ak-caption text-ink-muted">{t('autoNote')}</p>
      )}
    </section>
  )
}
