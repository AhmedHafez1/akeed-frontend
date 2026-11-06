'use client'

import { ExternalLink, Info, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import {
  SHOPIFY_PUBLIC_ALLOWANCES,
  type ShopifyPublicAllowance,
} from '@/shared/config/pricing'
import { formatCredits } from '@/shared/lib/money'

const PLAN_NAME_KEYS: Record<ShopifyPublicAllowance['id'], string> = {
  starter: 'planStarterName',
  basic: 'planBasicName',
  pro: 'planProName',
  business: 'planBusinessName',
}

interface ShopifyPlanPanelProps {
  /** Show each plan's two allowances: Akeed's number, then the own number. */
  showOwnNumber?: boolean
}

/**
 * The Shopify billing path, beside the credit card and not inside it.
 *
 * It deliberately carries no prices. Shopify bills in USD through its own
 * subscription flow while credits are EGP, so showing both on one page
 * invites a comparison the visitor cannot actually make. The App Store
 * listing is where Shopify presents its pricing, and it is always current
 * there. With the own-number promotion on, it lists message allowances only:
 * the Akeed pool first, the own-number pool as a separate extra.
 */
export function ShopifyPlanPanel({
  showOwnNumber = false,
}: ShopifyPlanPanelProps) {
  const t = useTranslations('pricing_credits')
  const tNames = useTranslations('embeddedOnboarding')
  const { targets, locale } = useAcquisition()

  return (
    <div className="border-border bg-card shadow-card mt-5 rounded-3xl border p-8 sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
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

      {showOwnNumber && (
        <>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SHOPIFY_PUBLIC_ALLOWANCES.map((plan) => (
              <li
                key={plan.id}
                className="border-border bg-card flex flex-col gap-2.5 rounded-2xl border p-[1.125rem]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-foreground font-semibold">
                    {tNames(PLAN_NAME_KEYS[plan.id])}
                  </h4>
                  <span className="border-border bg-muted text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap">
                    {t(
                      plan.oneTime
                        ? 'own_number.one_time'
                        : 'own_number.monthly'
                    )}
                  </span>
                </div>
                <p className="text-foreground text-[0.9375rem] leading-6">
                  {t.rich('own_number.akeed_line', {
                    count: formatCredits(plan.akeedMessages, locale),
                    b: (chunks) => (
                      <b className="me-0.5 text-[1.625rem] font-bold tabular-nums">
                        {chunks}
                      </b>
                    ),
                  })}
                </p>
                <p className="text-brand-ink flex items-start gap-1.5 text-sm leading-[1.375rem] font-semibold">
                  <Plus
                    aria-hidden="true"
                    className="mt-[3px] h-4 w-4 shrink-0"
                  />
                  <span>
                    {t('own_number.own_line', {
                      count: formatCredits(plan.ownNumberMessages, locale),
                    })}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 flex items-start gap-2 text-[0.8125rem] leading-5">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('own_number.shopify_note')}</span>
          </p>
        </>
      )}
    </div>
  )
}
