'use client'

import { Check, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'

/*
 * What a credit actually buys. This is the correction that matters most on the
 * page: billing meters each outbound WhatsApp message the provider accepted —
 * not each order — and a follow-up is another message. Saying "orders" here
 * would under-quote real cost by roughly half.
 */
const FACT_KEYS = ['credit_is_message', 'followup', 'rejected'] as const

interface PricingFactsPanelProps {
  /** Add the optional own-number fact, with Meta's separate charge. */
  showOwnNumber?: boolean
}

/** The light half of the pricing card: how credit billing works. */
export function PricingFactsPanel({
  showOwnNumber = false,
}: PricingFactsPanelProps) {
  const t = useTranslations('pricing_credits')

  return (
    <div className="bg-card flex flex-col p-8 sm:p-10 lg:p-12">
      <h3 className="text-foreground text-xl font-bold">{t('how_title')}</h3>

      <ul className="mt-8 space-y-7">
        {FACT_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-3">
            <span className="bg-primary-subtle ring-primary-border mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1">
              <Check className="text-primary h-4 w-4" strokeWidth={3} />
            </span>
            <div>
              <p className="text-foreground font-semibold">
                {t(`${key}_title`)}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {t(`${key}_body`)}
              </p>
            </div>
          </li>
        ))}
        {showOwnNumber && (
          <li className="border-primary-border flex items-start gap-3 border-t border-dashed pt-6">
            <span className="bg-primary-subtle ring-primary-border mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1">
              <Smartphone aria-hidden="true" className="text-primary h-4 w-4" />
            </span>
            <div>
              <p className="text-foreground font-semibold">
                {t('own_number.fact_title')}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {t('own_number.fact_body')}
              </p>
            </div>
          </li>
        )}
      </ul>
    </div>
  )
}
