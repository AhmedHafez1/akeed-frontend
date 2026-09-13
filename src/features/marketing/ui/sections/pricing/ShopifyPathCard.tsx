'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import { landingCardClass } from '@/features/marketing/ui/components/LandingPrimitives'
import { cn } from '@/shared/lib/utils'

/*
 * Deliberately carries no numbers. Shopify bills in USD through its own
 * subscription flow while credits are EGP, so showing both on one page invites
 * a comparison the visitor cannot actually make. The App Store listing is where
 * Shopify presents its pricing, and it is always current there.
 */
export function ShopifyPathCard() {
  const t = useTranslations('pricing_credits')
  const { isRTL, targets } = useAcquisition()

  return (
    <article
      className={cn(
        landingCardClass,
        'flex flex-col gap-5',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <span className="bg-card ring-border/70 flex h-14 w-14 items-center justify-center rounded-full ring-1">
        <Image
          src="/images/landing/logos/shopify_icon_1.png"
          alt="Shopify"
          width={32}
          height={32}
          unoptimized
          className="h-8 w-8 object-contain"
        />
      </span>

      <div>
        <h3 className="text-foreground text-xl font-semibold">
          {t('shopify_title')}
        </h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {t('shopify_body')}
        </p>
      </div>

      <AcquisitionCta
        target={targets.shopify}
        label={t('shopify_cta')}
        variant="secondary"
        className="mt-auto w-full"
      />
    </article>
  )
}
