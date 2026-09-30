'use client'

import { CheckCircle, CreditCard, Phone, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  CREDIT_CURRENCY,
  CREDIT_FREE_GRANT,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import type { SupportedLocale } from '@/shared/lib/locale'
import { formatCredits, formatMoneyParts } from '@/shared/lib/money'

interface SignupBenefitsProps {
  locale: SupportedLocale
}

interface Benefit {
  id: string
  icon: LucideIcon
  title: string
  body: string
}

/**
 * The desktop aside beside signup: what the merchant gets, in numbers. The
 * grant and the price come from the shared pricing config, never the copy.
 */
export function SignupBenefits({ locale }: SignupBenefitsProps) {
  const t = useTranslations('auth.signup.benefits')
  const { amount, currency } = formatMoneyParts(
    CREDIT_UNIT_PRICE_MINOR,
    CREDIT_CURRENCY,
    locale
  )
  // Same shape as onboarding's credit offer ("2.00 ج.م"); Intl ends the
  // Arabic pound with a period, which reads wrong mid-sentence.
  const price = `${amount} ${currency.replace(/\.$/, '')}`

  const benefits: Benefit[] = [
    {
      id: 'credits',
      icon: CheckCircle,
      title: t('credits.title', {
        count: CREDIT_FREE_GRANT,
        formatted: formatCredits(CREDIT_FREE_GRANT, locale),
      }),
      body: t('credits.body'),
    },
    {
      id: 'test',
      icon: Phone,
      title: t('test.title'),
      body: t('test.body'),
    },
    {
      id: 'price',
      icon: CreditCard,
      title: t('price.title'),
      body: t('price.body', { price }),
    },
  ]

  return (
    <aside aria-labelledby="signup-benefits-heading" className="text-start">
      <h2
        id="signup-benefits-heading"
        className="text-ink text-h3 mb-6 font-bold"
      >
        {t('heading')}
      </h2>
      <ul className="space-y-6">
        {benefits.map(({ id, icon: Icon, title, body }) => (
          <li key={id} className="flex items-start gap-3">
            <Icon
              aria-hidden="true"
              className="text-primary mt-0.5 size-6 shrink-0"
            />
            <div className="space-y-1">
              <p className="text-ink font-semibold">{title}</p>
              <p className="text-ink-muted text-sm">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
