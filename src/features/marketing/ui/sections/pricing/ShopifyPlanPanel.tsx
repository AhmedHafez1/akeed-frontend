'use client'

import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'

/**
 * The Shopify billing path, beside the credit card and not inside it.
 *
 * It deliberately carries no numbers. Shopify bills in USD through its own
 * subscription flow while credits are EGP, so showing both on one page
 * invites a comparison the visitor cannot actually make. The App Store
 * listing is where Shopify presents its pricing, and it is always current
 * there.
 */
export function ShopifyPlanPanel() {
  const t = useTranslations('pricing_credits')
  const { targets } = useAcquisition()

  return (
    <div className="border-border bg-card shadow-card mt-5 flex flex-col gap-6 rounded-3xl border p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      <div className="text-start">
        <div className="flex items-center gap-3">
          <Image
            src="/images/landing/logos/shopify_icon_1.png"
            alt=""
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 shrink-0 object-contain"
          />
          <h3 className="text-foreground text-xl font-bold">
            {t('shopify_title')}
          </h3>
        </div>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          {t('shopify_body')}
        </p>
      </div>

      <AcquisitionCta
        target={targets.shopify}
        label={t('shopify_cta')}
        variant="compactSecondary"
        className="h-12 shrink-0 px-6 text-[0.9375rem]"
        trailing={
          <ExternalLink
            aria-hidden="true"
            className="text-muted-foreground h-4 w-4"
          />
        }
      />
    </div>
  )
}
