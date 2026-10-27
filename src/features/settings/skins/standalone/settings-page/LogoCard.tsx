'use client'

/* eslint-disable @next/next/no-img-element -- the merchant's own upload, served from storage */

import { useId, useRef } from 'react'
import { ImageUp, Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LOGO_ACCEPT_ATTRIBUTE } from '@/features/settings/domain/merchantLogo'
import type { MerchantLogoModel } from '@/features/settings/domain/useMerchantLogo'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard } from '@/shared/ui'
import { SettingsHelp } from './SettingsHelp'

interface LogoCardProps {
  logo: MerchantLogoModel
  readOnly: boolean
}

/**
 * The store's logo: upload, replace or remove it, and see the banner built
 * from it, which goes on top of the confirmation and the reminder.
 */
export function LogoCard({ logo, readOnly }: LogoCardProps) {
  const t = useTranslations('settings.logo')
  const headingId = useId()
  const errorId = useId()
  const input = useRef<HTMLInputElement>(null)
  const { branding, isUploading, isRemoving, error } = logo
  const busy = isUploading || isRemoving
  const hasLogo = Boolean(branding.logoUrl)

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={busy}
      className={cn(akCard, 'space-y-3 px-4 py-4 sm:px-6')}
    >
      <div className="flex items-center gap-1">
        <h2 id={headingId} className="text-ak-section text-ink">
          {t('heading')}
        </h2>
        <SettingsHelp label={t('heading')} content={t('description')} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="border-line bg-surface-sunken rounded-ak-control flex size-20 shrink-0 items-center justify-center overflow-hidden border">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={t('logoAlt')}
              className="max-h-full max-w-full object-contain p-1.5"
            />
          ) : (
            <ImageUp aria-hidden="true" className="text-ink-muted size-6" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-ak-caption text-ink-muted">{t('requirements')}</p>
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <input
                ref={input}
                type="file"
                accept={LOGO_ACCEPT_ATTRIBUTE}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  logo.choose(event.target.files?.[0])
                  // Choosing the same file again still uploads it.
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => input.current?.click()}
                disabled={busy}
                aria-describedby={error ? errorId : undefined}
                className={akButton({ variant: 'secondary', size: 'row' })}
              >
                {isUploading ? (
                  <Loader2
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <ImageUp aria-hidden="true" />
                )}
                {hasLogo ? t('replace') : t('upload')}
              </button>
              {hasLogo && (
                <button
                  type="button"
                  onClick={logo.remove}
                  disabled={busy}
                  className={akButton({ variant: 'ghost', size: 'row' })}
                >
                  {isRemoving ? (
                    <Loader2
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                    />
                  ) : (
                    <Trash2 aria-hidden="true" />
                  )}
                  {t('remove')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-ak-caption text-ak-danger font-semibold"
        >
          {t(`errors.${error}`)}
        </p>
      )}

      {branding.bannerUrl && (
        <figure className="border-line space-y-1.5 border-t pt-3">
          <img
            src={branding.bannerUrl}
            alt={t('bannerAlt')}
            className="border-line rounded-ak-control aspect-[1200/628] w-full border object-cover"
          />
          <figcaption className="text-ak-caption text-ink-muted">
            {t('bannerCaption')}
          </figcaption>
        </figure>
      )}
    </section>
  )
}
