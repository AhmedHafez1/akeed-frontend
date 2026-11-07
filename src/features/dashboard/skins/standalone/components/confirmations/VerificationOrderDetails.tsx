'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getOrderDetails } from '@/features/dashboard/domain/orderDetails'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

export function VerificationOrderDetails({
  verification,
}: {
  verification: VerificationItem
}) {
  const t = useTranslations('dashboard.table.orderDetails')
  const { locale } = useLocaleInfo()
  const id = useId()
  const details = getOrderDetails(verification, locale)

  return (
    <>
      {details.products.length > 0 && (
        <section aria-labelledby={`${id}-products`} className="min-w-0 text-sm">
          <h3 id={`${id}-products`} className="text-foreground font-semibold">
            {t('products')}
          </h3>
          <ul className="divide-border mt-3 divide-y">
            {details.products.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <p className="text-foreground font-medium">
                    <bdi>{item.name}</bdi>
                  </p>
                  {item.options && (
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      <bdi>{item.options}</bdi>
                    </p>
                  )}
                </div>
                <div className="max-w-[48%] shrink-0 text-end [overflow-wrap:anywhere]">
                  <bdi dir="ltr">{item.quantity}</bdi>
                  {item.amount !== null && (
                    <p className="text-foreground mt-1 font-medium">
                      <bdi dir="ltr">{item.amount}</bdi>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(details.region || details.address) && (
        <section aria-labelledby={`${id}-address`} className="min-w-0 text-sm">
          <h3 id={`${id}-address`} className="text-foreground font-semibold">
            {t('deliveryAddress')}
          </h3>
          <div className="mt-3 [overflow-wrap:anywhere] whitespace-pre-wrap">
            {details.region && (
              <p className="text-foreground">
                <bdi>{details.region}</bdi>
              </p>
            )}
            {details.address && (
              <p className="text-muted-foreground mt-1">
                <bdi>{details.address}</bdi>
              </p>
            )}
          </div>
        </section>
      )}
    </>
  )
}
