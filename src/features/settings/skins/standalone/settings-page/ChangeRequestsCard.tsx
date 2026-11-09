'use client'

import { useId } from 'react'
import { Clock, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AkSwitch, akCard, akPill } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

/**
 * "Request a change": a third button on future confirmation messages. Off
 * by default; while the store's messages are not ready the switch cannot be
 * turned on. Switching it off affects new messages only.
 */
export function ChangeRequestsCard({
  checked,
  ready,
  onChange,
  readOnly,
  variants,
}: {
  checked: boolean
  /** The store's sender has its approved three-button messages. */
  ready: boolean
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
  const blocked = !ready && !checked
  return (
    <section
      className={cn(akCard, 'space-y-4 px-4 py-4 sm:px-6')}
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id={`${id}-heading`} className="text-ak-section text-ink">
          {t('heading')}
        </h2>
        <span className={akPill({ tone: checked ? 'brand' : 'neutral' })}>
          {t(checked ? 'on' : 'off')}
        </span>
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
          <AkSwitch
            id={`${id}-switch`}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-description${blocked ? ` ${id}-unavailable` : ''}`}
            checked={checked}
            disabled={readOnly || blocked}
            onCheckedChange={onChange}
          />
        </div>
        <p id={`${id}-description`} className="text-ak-caption text-ink-muted">
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
      {variants?.some((v) => v.branding_supported === false) && (
        <p className="text-ak-caption text-ink-muted">{t('ownNumberText')}</p>
      )}
      <div className="border-line flex items-start gap-2 border-t pt-4">
        <Info
          aria-hidden="true"
          className="text-ink-muted mt-0.5 size-4 shrink-0"
        />
        <ul className="text-ak-caption text-ink-muted space-y-1">
          <li>{t('noteAck')}</li>
          <li>{t('noteOff')}</li>
        </ul>
      </div>
    </section>
  )
}
