'use client'

import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Check, RefreshCw } from 'lucide-react'
import { LoadingButton } from '@/shared/ui'
import { Notice } from '../connect/connectUi'
import {
  hasWebhookIn,
  isUnnamedWooCommerceError,
  toWooCommerceErrorKey,
  type WooCommerceConnectionDetails,
} from './wooCommerce.types'
import type { WooCommerceConnectionController } from './useWooCommerceConnection'

interface WooCommerceWebhookStatusProps {
  details: WooCommerceConnectionDetails
  connection: Pick<
    WooCommerceConnectionController,
    | 'canManage'
    | 'isEnabling'
    | 'enableErrorCode'
    | 'webhooksEnabled'
    | 'enableWebhooks'
  >
}

/**
 * The order notifications Akeed created in the store, each with the state
 * the store last gave it, and what to do about one that is not active. A
 * notification the store disabled can be re-enabled from here; orders placed
 * while it was disabled are not imported, and the screen says so.
 */
export function WooCommerceWebhookStatus({
  details,
  connection,
}: WooCommerceWebhookStatusProps) {
  const t = useTranslations('wooCommerceConnect.webhooks')
  const tCodes = useTranslations('wooCommerceConnect.codes')
  const locale = useLocale()
  const formatWhen = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      numberingSystem: 'latn',
    }).format(new Date(iso))

  return (
    <div className="space-y-3 text-start">
      <h2 className="text-ink text-sm font-semibold">{t('title')}</h2>
      <dl className="space-y-1 text-sm">
        {details.webhooks.map((webhook) => (
          <div key={webhook.kind} className="flex flex-wrap gap-x-2">
            <dt className="text-ink-muted">{t(`kinds.${webhook.kind}`)}</dt>
            <dd className="text-ink font-semibold">
              {t(`states.${webhook.state}`)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-ink-muted text-sm">
        {details.webhooksCheckedAt
          ? t('checkedAt', { when: formatWhen(details.webhooksCheckedAt) })
          : t('neverChecked')}
      </p>

      {hasWebhookIn(details, 'disabled') && (
        <Notice
          tone="warning"
          icon={<AlertCircle aria-hidden="true" />}
          role="status"
        >
          <span className="block font-semibold">{t('disabled.title')}</span>
          <span className="block">{t('disabled.body')}</span>
          <span className="block">{t('disabled.missedOrders')}</span>
        </Notice>
      )}
      {hasWebhookIn(details, 'disabled') && (
        <LoadingButton
          className="w-full gap-2 font-semibold sm:w-auto"
          disabled={!connection.canManage}
          loading={connection.isEnabling}
          loadingText={t('disabled.enabling')}
          onClick={() => void connection.enableWebhooks()}
        >
          <RefreshCw aria-hidden="true" />
          {t('disabled.enable')}
        </LoadingButton>
      )}
      {connection.enableErrorCode && (
        <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
          {isUnnamedWooCommerceError(connection.enableErrorCode)
            ? t('disabled.failed')
            : tCodes(toWooCommerceErrorKey(connection.enableErrorCode))}
        </Notice>
      )}
      {connection.webhooksEnabled && (
        <p role="status" className="text-ink flex items-start gap-2 text-sm">
          <Check
            aria-hidden="true"
            className="text-primary mt-0.5 size-4 shrink-0"
          />
          {t('enabled')}
        </p>
      )}

      {hasWebhookIn(details, 'missing') && (
        <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
          {t('missing')}
        </Notice>
      )}
      {hasWebhookIn(details, 'paused') && (
        <Notice
          tone="warning"
          icon={<AlertCircle aria-hidden="true" />}
          role="status"
        >
          {t('paused')}
        </Notice>
      )}
      {details.rejectedDeliveries > 0 && (
        <Notice
          tone="warning"
          icon={<AlertCircle aria-hidden="true" />}
          role="status"
        >
          {t('rejectedDeliveries', { count: details.rejectedDeliveries })}
        </Notice>
      )}
    </div>
  )
}
