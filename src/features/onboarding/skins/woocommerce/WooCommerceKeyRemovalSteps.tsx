'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { Notice } from '../connect/connectUi'
import type { WooCommerceWebhookCleanup } from './wooCommerce.types'

const KEY_STEPS = ['openSettings', 'revokeKey'] as const

interface WooCommerceKeyRemovalStepsProps {
  /**
   * What the store answered when Akeed asked it to delete its order
   * notifications. Null when this screen did not see the disconnect happen.
   */
  webhookCleanup: WooCommerceWebhookCleanup | null
}

/**
 * What the merchant removes in WooCommerce by hand after a disconnect. Akeed
 * cannot revoke its own API key there, so that step is always shown. The
 * order notifications are Akeed's to delete; when the store did not take the
 * deletion, the screen says so and adds the step.
 */
export function WooCommerceKeyRemovalSteps({
  webhookCleanup,
}: WooCommerceKeyRemovalStepsProps) {
  const t = useTranslations('wooCommerceConnect.removal')
  const removed = webhookCleanup === 'removed'

  return (
    <div className="space-y-2 text-start">
      <h2 className="text-ink text-sm font-semibold">{t('title')}</h2>
      <p className="text-ink-muted text-sm">{t('intro')}</p>
      <ol className="text-ink list-decimal space-y-1.5 ps-5 text-sm">
        {KEY_STEPS.map((step) => (
          <li key={step}>{t(`steps.${step}`)}</li>
        ))}
        {!removed && <li>{t('steps.deleteWebhooks')}</li>}
      </ol>
      {webhookCleanup === 'failed' ? (
        <Notice
          tone="warning"
          icon={<AlertCircle aria-hidden="true" />}
          role="status"
        >
          {t('webhooksLeft')}
        </Notice>
      ) : (
        <p className="text-ink-muted text-sm">
          {removed ? t('webhooksRemoved') : t('webhooksUnknown')}
        </p>
      )}
      <p className="text-ink-muted text-sm">{t('support')}</p>
    </div>
  )
}
