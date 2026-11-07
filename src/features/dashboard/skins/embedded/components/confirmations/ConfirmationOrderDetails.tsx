'use client'

import { useId } from 'react'
import { BlockStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getOrderDetails } from '@/features/dashboard/domain/orderDetails'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

export function ConfirmationOrderDetails({
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
        <section aria-labelledby={`${id}-products`} className="min-w-0">
          <BlockStack gap="300">
            <Text as="h3" id={`${id}-products`} variant="headingSm">
              {t('products')}
            </Text>
            <ul className="m-0 flex list-none flex-col divide-y divide-[#e3e3e3] p-0">
              {details.products.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      <bdi>{item.name}</bdi>
                    </Text>
                    {item.options && (
                      <div className="mt-1">
                        <Text as="p" variant="bodySm" tone="subdued">
                          <bdi>{item.options}</bdi>
                        </Text>
                      </div>
                    )}
                  </div>
                  <div className="max-w-[48%] shrink-0 text-end [overflow-wrap:anywhere]">
                    <Text as="p" variant="bodyMd">
                      <bdi dir="ltr">{item.quantity}</bdi>
                    </Text>
                    {item.amount !== null && (
                      <div className="mt-1">
                        <Text as="p" variant="bodyMd" fontWeight="medium">
                          <bdi dir="ltr">{item.amount}</bdi>
                        </Text>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </BlockStack>
        </section>
      )}

      {(details.region || details.address) && (
        <section aria-labelledby={`${id}-address`} className="min-w-0">
          <BlockStack gap="300">
            <Text as="h3" id={`${id}-address`} variant="headingSm">
              {t('deliveryAddress')}
            </Text>
            <div className="[overflow-wrap:anywhere] whitespace-pre-wrap">
              {details.region && (
                <Text as="p" variant="bodyMd">
                  <bdi>{details.region}</bdi>
                </Text>
              )}
              {details.address && (
                <div className="mt-1">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    <bdi>{details.address}</bdi>
                  </Text>
                </div>
              )}
            </div>
          </BlockStack>
        </section>
      )}
    </>
  )
}
