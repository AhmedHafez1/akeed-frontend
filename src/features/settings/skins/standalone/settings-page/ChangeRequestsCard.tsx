'use client'

import { useId } from 'react'
import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AkSwitch, InfoHint, akCard } from '@/shared/ui'
import { Tooltip } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/utils'

/**
 * "Request a change": a third button on future confirmation messages. Off
 * by default; while the store's messages are not ready the switch cannot be
 * turned on. Switching it off affects new messages only.
 */
export function ChangeRequestsCard({
  checked,
  ready,
  styleReady = true,
  onChange,
  readOnly,
  variants,
}: {
  checked: boolean
  /** The store's sender has its approved three-button messages. */
  ready: boolean
  /** The selected style has its change-request version. */
  styleReady?: boolean
  onChange: (checked: boolean) => void
  readOnly: boolean
  variants?: {
    ready: boolean
    reason: string | null
    branding_supported?: boolean
  }[]
}) {
  const t = useTranslations('settings.changeRequests')
  const id = useId()
  const blocked = (!ready || !styleReady) && !checked
  const styleBlocked = ready && !styleReady && !checked
  const ownNumberText = variants?.some((v) => v.branding_supported === false)
  return (
    <section
      className={cn(akCard, 'space-y-3 px-4 py-4 sm:px-6')}
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex items-center gap-1">
        <h2 id={`${id}-heading`} className="text-ak-section text-ink">
          {t('heading')}
        </h2>
        <InfoHint
          label={t('heading')}
          content={
            <span className="block space-y-2">
              <span className="block">{t('description')}</span>
              <span className="block">{t('noteAck')}</span>
              {ownNumberText && (
                <span className="block">{t('ownNumberText')}</span>
              )}
            </span>
          }
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            id={`${id}-label`}
            htmlFor={`${id}-switch`}
            className="text-ak-body text-ink font-medium"
          >
            {t('label')}
          </label>
          {styleBlocked ? (
            <Tooltip content={t('styleUnavailable')}>
              <AkSwitch
                id={`${id}-switch`}
                aria-labelledby={`${id}-label`}
                aria-describedby={`${id}-description`}
                checked={checked}
                disabled
                onCheckedChange={onChange}
              />
            </Tooltip>
          ) : (
            <AkSwitch
              id={`${id}-switch`}
              aria-labelledby={`${id}-label`}
              aria-describedby={`${id}-description${blocked ? ` ${id}-unavailable` : ''}`}
              checked={checked}
              disabled={readOnly || blocked}
              onCheckedChange={onChange}
            />
          )}
        </div>
        <p id={`${id}-description`} className="sr-only">
          {t('description')}
        </p>
        {!ready && (
          <p
            id={`${id}-unavailable`}
            role="status"
            className="text-ak-caption text-ak-warning flex items-center gap-1.5"
          >
            <Clock aria-hidden="true" className="size-3.5 shrink-0" />
            {variants?.some(
              (v) =>
                v.reason === 'change_image_twin_unavailable' ||
                v.reason === 'logo_banner_unavailable'
            )
              ? t('brandingUnavailable')
              : t('notAvailableYet')}
          </p>
        )}
      </div>
    </section>
  )
}
