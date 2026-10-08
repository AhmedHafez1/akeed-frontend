'use client'

import { useTranslations } from 'next-intl'

const KEY_STEPS = ['openSettings', 'deleteKey'] as const
const ALL_STEPS = [...KEY_STEPS, 'deleteWebhooks'] as const

interface ProviderRemovalStepsProps {
  /** Akeed deleted its webhooks at EasyOrders when it disconnected. */
  webhooksRemoved: boolean
}

/**
 * What is left for the merchant to remove in EasyOrders after a disconnect.
 * Akeed deletes its own webhooks there when it can; EasyOrders gives it no
 * way to delete the API key, so that step always stays.
 */
export function ProviderRemovalSteps({
  webhooksRemoved,
}: ProviderRemovalStepsProps) {
  const t = useTranslations('easyOrdersConnect.removal')
  const steps = webhooksRemoved ? KEY_STEPS : ALL_STEPS

  return (
    <div className="space-y-2 text-start">
      <h2 className="text-ink text-sm font-semibold">{t('title')}</h2>
      <p className="text-ink-muted text-sm">
        {webhooksRemoved ? t('removed.intro') : t('intro')}
      </p>
      <ol className="text-ink list-decimal space-y-1.5 ps-5 text-sm">
        {steps.map((step) => (
          <li key={step}>{t(`steps.${step}`)}</li>
        ))}
      </ol>
      <p className="text-ink-muted text-sm">
        {webhooksRemoved ? t('removed.note') : t('oldWebhooks')}
      </p>
      <p className="text-ink-muted text-sm">{t('support')}</p>
    </div>
  )
}
