'use client'

import { useTranslations } from 'next-intl'

const STEPS = ['openSettings', 'deleteKey', 'deleteWebhooks'] as const

/**
 * What the merchant removes in EasyOrders by hand. Akeed's disconnect is
 * local: it does not delete the API key or the webhooks at EasyOrders, so the
 * steps are shown wherever a disconnect is offered or has happened.
 */
export function ProviderRemovalSteps() {
  const t = useTranslations('easyOrdersConnect.removal')

  return (
    <div className="space-y-2 text-start">
      <h2 className="text-ink text-sm font-semibold">{t('title')}</h2>
      <p className="text-ink-muted text-sm">{t('intro')}</p>
      <ol className="text-ink list-decimal space-y-1.5 ps-5 text-sm">
        {STEPS.map((step) => (
          <li key={step}>{t(`steps.${step}`)}</li>
        ))}
      </ol>
      <p className="text-ink-muted text-sm">{t('oldWebhooks')}</p>
      <p className="text-ink-muted text-sm">{t('support')}</p>
    </div>
  )
}
