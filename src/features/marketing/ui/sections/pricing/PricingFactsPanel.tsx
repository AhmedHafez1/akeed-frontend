'use client'

import { ArrowRight, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'

/*
 * What a credit actually buys. This is the correction that matters most on the
 * page: billing meters one outbound WhatsApp message the provider accepted —
 * not one order — and a follow-up consumes a second credit. Saying "orders"
 * here would under-quote real cost by roughly half.
 */
const FACT_KEYS = ['credit_is_message', 'followup', 'rejected'] as const

/**
 * The light half of the pricing card: how billing works, then the Shopify path.
 *
 * The Shopify row deliberately carries no numbers. Shopify bills in USD through
 * its own subscription flow while credits are EGP, so showing both on one page
 * invites a comparison the visitor cannot actually make. The App Store listing
 * is where Shopify presents its pricing, and it is always current there.
 */
export function PricingFactsPanel() {
  const t = useTranslations('pricing_credits')
  const { targets } = useAcquisition()

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
      </ul>

      <div className="border-border mt-auto flex items-center justify-between gap-4 border-t pt-8">
        <div>
          <p className="text-foreground text-sm font-semibold">
            {t('shopify_title')}
          </p>
          <AcquisitionCta
            target={targets.shopify}
            label={t('shopify_cta')}
            variant="link"
            className="mt-1 text-sm"
            trailing={
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
            }
          />
        </div>

        <span className="bg-primary-subtle ring-primary-border flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1">
          <Image
            src="/images/landing/logos/shopify_icon_1.png"
            alt="Shopify"
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 object-contain"
          />
        </span>
      </div>
    </div>
  )
}
