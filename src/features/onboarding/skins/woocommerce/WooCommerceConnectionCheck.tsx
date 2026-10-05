'use client'

import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Check, Stethoscope } from 'lucide-react'
import { LoadingButton } from '@/shared/ui'
import { Notice } from '../easyorders/easyOrdersUi'
import { toWooCommerceCheckKey } from './wooCommerce.types'
import type { WooCommerceConnectionController } from './useWooCommerceConnection'

interface WooCommerceConnectionCheckProps {
  connection: Pick<
    WooCommerceConnectionController,
    'canManage' | 'isChecking' | 'checkResult' | 'checkErrorCode' | 'check'
  >
}

/**
 * Asks the store whether the connection still works and says what it found,
 * each problem with its own guidance. Nothing checks in the background, so
 * this is how a merchant finds a notification the store disabled.
 */
export function WooCommerceConnectionCheck({
  connection,
}: WooCommerceConnectionCheckProps) {
  const t = useTranslations('wooCommerceConnect.check')
  const locale = useLocale()
  const { checkResult } = connection
  const formatWhen = (iso: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      numberingSystem: 'latn',
    }).format(new Date(iso))

  return (
    <div className="space-y-3 text-start">
      <p className="text-ink-muted text-sm">{t('help')}</p>
      <LoadingButton
        variant="outline"
        className="w-full gap-2 font-semibold sm:w-auto"
        disabled={!connection.canManage}
        loading={connection.isChecking}
        loadingText={t('checking')}
        onClick={() => void connection.check()}
      >
        <Stethoscope aria-hidden="true" />
        {t('button')}
      </LoadingButton>
      {connection.checkErrorCode && (
        <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
          {t('failed')}
        </Notice>
      )}
      {checkResult && checkResult.problems.length === 0 && (
        <p role="status" className="text-ink flex items-start gap-2 text-sm">
          <Check
            aria-hidden="true"
            className="text-primary mt-0.5 size-4 shrink-0"
          />
          {t('ok')}
        </p>
      )}
      {checkResult && checkResult.problems.length > 0 && (
        <div role="alert" className="space-y-2">
          <p className="text-ink text-sm font-semibold">{t('found')}</p>
          <ul className="text-ink list-disc space-y-1.5 ps-5 text-sm">
            {checkResult.problems.map((problem) => (
              <li key={problem}>
                {t(`problems.${toWooCommerceCheckKey(problem)}`)}
              </li>
            ))}
          </ul>
          <p className="text-ink-muted text-sm">{t('support')}</p>
        </div>
      )}
      {checkResult && (
        <p className="text-ink-muted text-sm">
          {t('checkedAt', { when: formatWhen(checkResult.checkedAt) })}
        </p>
      )}
    </div>
  )
}
