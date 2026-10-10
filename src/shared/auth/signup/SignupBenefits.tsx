'use client'

import { useTranslations } from 'next-intl'
import type { SupportedLocale } from '@/shared/lib/locale'
import { getSignupOffer } from './signupOffer'

interface SignupBenefitsProps {
  locale: SupportedLocale
  /** The order source chosen in step 1; its setup decides the steps. */
  sourceId: string
}

const NEXT_STEPS = ['first', 'second', 'third'] as const

/**
 * The desktop aside beside the account form: what happens after "Create
 * account" for this order source, then what it costs. The grant and the price
 * come from the shared pricing config, never the copy.
 */
export function SignupBenefits({ locale, sourceId }: SignupBenefitsProps) {
  const t = useTranslations('auth.signup')
  const offer = getSignupOffer(locale)

  return (
    <aside aria-labelledby="signup-next-heading" className="text-start">
      <h2 id="signup-next-heading" className="text-ink text-h3 mb-6 font-bold">
        {t('next.heading')}
      </h2>
      <ol className="space-y-6">
        {NEXT_STEPS.map((step, index) => (
          <li key={step} className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="bg-brand-soft text-brand-ink inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <p className="text-ink font-semibold">
                {t(`next.steps.${sourceId}.${step}.title`)}
              </p>
              <p className="text-ink-muted text-sm">
                {t(`next.steps.${sourceId}.${step}.body`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="border-line bg-card rounded-ak-card mt-6 space-y-1.5 border p-4">
        <p className="text-ink font-semibold">
          {t('benefits.credits.title', {
            count: offer.count,
            formatted: offer.formattedCount,
          })}
        </p>
        <p className="text-ink-muted text-sm">
          {t('benefits.price.body', { price: offer.price })}
        </p>
      </div>
    </aside>
  )
}
