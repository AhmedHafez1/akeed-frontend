'use client'

import { useId } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AkSwitch, akCard } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import {
  CREDIT_CURRENCY,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import { formatBalance } from '@/shared/lib/balanceMoney'
import { getLocaleDirection, type SupportedLocale } from '@/shared/lib/locale'
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
  const ack = props.acknowledgment
  // Prices from the API; derived from the credit rates for an older backend.
  const money = (minor: number) =>
    formatBalance(minor, CREDIT_CURRENCY, locale as SupportedLocale)
  const akeedPrice =
    ack.akeedMessagePriceMinor ??
    ack.creditsPerMessage * CREDIT_UNIT_PRICE_MINOR
  const own = ack.ownNumberCreditsPerMessage
  const ownPrice =
    ack.ownNumberMessagePriceMinor ??
    (typeof own === 'number' && Number.isFinite(own)
      ? own * CREDIT_UNIT_PRICE_MINOR
      : null)
  const cost =
    ownPrice !== null
      ? t('senderCreditCost', {
          own: money(ownPrice),
          akeed: money(akeedPrice),
        })
      : t('akeedCreditCost', { count: money(akeedPrice) })
  return (
    <section
      className={cn(akCard, 'space-y-4 p-5 sm:p-6')}
      aria-labelledby={id + '-heading'}
    >
      <h2 id={id + '-heading'} className="text-ak-section text-ink">
        {t('heading')}
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            id={id + '-label'}
            htmlFor={id + '-switch'}
            className="text-ak-body text-ink font-medium"
          >
            {t('label')}
          </label>
          <AkSwitch
            id={id + '-switch'}
            aria-labelledby={id + '-label'}
            aria-describedby={
              id +
              '-description ' +
              id +
              '-cost' +
              (!available ? ' ' + id + '-unavailable' : '')
            }
            checked={props.checked}
            disabled={props.readOnly || (!available && !props.checked)}
            onCheckedChange={props.onChange}
          />
        </div>
        <p id={id + '-description'} className="sr-only">
          {t('description')}
        </p>
        <p id={id + '-cost'} className="text-ak-caption text-ink-muted">
          {cost}
        </p>
      </div>
      <details className="border-line border-t pt-4">
        <summary className="text-ak-caption text-ink-muted ak-focus cursor-pointer rounded-sm">
          {t('examplesHeading')}
        </summary>
        <div className="text-ak-caption text-ink-muted space-y-4 pt-4">
          <p>{t('description')}</p>
          <p>{tLanguages(props.language)}</p>
          {props.automaticStyle && <p>{t('autoNote')}</p>}
          {(['confirmed', 'canceled'] as const).map((outcome) => (
            <div key={outcome} className="space-y-2">
              <h3 className="text-ink font-semibold">{t(outcome)}</h3>
              <p
                className="border-line bg-surface-sunken rounded-ak-control border px-3 py-2.5 text-start wrap-anywhere whitespace-pre-wrap"
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
      </details>
      {!available && (
        <p
          id={id + '-unavailable'}
          role="status"
          className="text-ak-caption border-ak-warning-line bg-ak-warning-soft text-ak-warning rounded-ak-control border px-3 py-2.5"
        >
          {t('unavailable')}
        </p>
      )}
    </section>
  )
}
