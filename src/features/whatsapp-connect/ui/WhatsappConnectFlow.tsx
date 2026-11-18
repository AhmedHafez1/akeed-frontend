'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Check, CircleAlert, Loader2 } from 'lucide-react'
import { resolveSupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard } from '@/shared/ui'
import { useConnectPage, type ConnectPageState } from '../hooks/useConnectPage'
import { metaErrorKey, serverErrorKey } from '../model/signupErrors'

function Busy({ children }: { children: ReactNode }) {
  return (
    <p className="text-ak-body text-ink-muted flex items-center gap-3">
      <Loader2
        aria-hidden="true"
        className="text-brand size-5 shrink-0 motion-safe:animate-spin"
      />
      {children}
    </p>
  )
}

function Failure({ state }: { state: ConnectPageState }) {
  const t = useTranslations('whatsappConnect')
  if (state.status === 'missing')
    return (
      <div className="space-y-2">
        <h1 className="text-ak-title text-ink">{t('missingHeading')}</h1>
        <p className="text-ak-body text-ink-muted">{t('missing')}</p>
      </div>
    )
  if (state.status === 'expired')
    return <p className="text-ak-body text-ink-muted">{t('expired')}</p>
  if (state.status === 'failed' || state.status === 'invalid')
    return (
      <div className="space-y-3">
        <h1 className="text-ak-title text-ink">{t('failedHeading')}</h1>
        <p className="text-ak-body text-ink-muted">
          {t('errors.' + serverErrorKey(state.errorCode))}
        </p>
        <p className="text-ak-caption text-ink-muted">{t('startAgain')}</p>
      </div>
    )
  if (state.status === 'returned')
    return (
      <div
        className={cn(
          'rounded-ak-control flex gap-3 border p-4',
          state.cancelled
            ? 'border-line bg-surface-sunken'
            : 'border-ak-warning-line bg-ak-warning-soft'
        )}
      >
        <CircleAlert
          aria-hidden="true"
          className="text-ak-warning mt-0.5 size-5 shrink-0"
        />
        <div className="space-y-2">
          {state.cancelled ? (
            <p className="text-ak-body text-ink">{t('cancelled')}</p>
          ) : (
            <>
              <h2 className="text-ak-section text-ink">
                {t('metaErrorHeading')}
              </h2>
              <p className="text-ak-body text-ink-muted">
                {t('metaErrors.' + metaErrorKey(state.metaErrorCode))}
              </p>
              {state.metaErrorCode && (
                <p className="text-ak-caption text-ink-muted">
                  {t('metaErrorCode', { code: state.metaErrorCode })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    )
  return null
}

/** Connecting ends with success; ongoing approval belongs to WhatsApp settings. */
export function WhatsappConnectFlow() {
  const t = useTranslations('whatsappConnect')
  const locale = resolveSupportedLocale(useLocale())
  const { state, returnUrl, goToMeta } = useConnectPage(locale)
  const outcome = useRef<HTMLDivElement>(null)
  const settled = !['claiming', 'ready', 'submitting'].includes(state.status)
  useEffect(() => {
    if (settled) outcome.current?.focus()
  }, [settled, state.status])
  const canGo = state.status === 'ready' || state.status === 'returned'
  const leaving = canGo && state.leaving
  const connected = state.status === 'connected'
  return (
    <div
      ref={outcome}
      tabIndex={-1}
      className="outline-none"
      role="status"
      aria-live="polite"
    >
      <article
        className={cn(
          akCard,
          'mx-auto w-full max-w-110 p-6 sm:p-7',
          connected && 'text-center'
        )}
      >
        {connected ? (
          <>
            <span
              aria-hidden="true"
              className="border-brand-line bg-brand-soft text-brand-ink mx-auto mb-5 flex size-13 items-center justify-center rounded-full border"
            >
              <Check className="size-7" />
            </span>
            <h1 className="text-ak-title text-ink">{t('connected.heading')}</h1>
            {state.completion.displayPhoneNumber && (
              <p className="text-ak-body text-ink-muted mt-2">
                <bdi dir="ltr" className="tabular-nums">
                  {state.completion.displayPhoneNumber}
                </bdi>
              </p>
            )}
            <a
              href={returnUrl ?? '/' + locale + '/settings?tab=whatsapp'}
              referrerPolicy="no-referrer"
              className={cn(
                akButton({ variant: 'primary', size: 'lg' }),
                'mt-7 w-full'
              )}
            >
              {t('backToSettings')}
            </a>
          </>
        ) : state.status === 'claiming' || state.status === 'submitting' ? (
          <Busy>{t(state.status)}</Busy>
        ) : (
          <div className="space-y-5">
            {canGo && (
              <>
                <div className="mb-6 flex items-center gap-2.5">
                  <Image
                    src="/images/akeed-web-app-icon-512.png"
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-ak-control size-8"
                  />
                  <span className="text-ak-body text-ink font-semibold">
                    Akeed
                  </span>
                </div>
                <header className="space-y-2">
                  <h1 className="text-ak-title text-ink">{t('title')}</h1>
                  <p className="text-ak-body text-ink-muted">{t('intro')}</p>
                </header>
              </>
            )}
            {state.status === 'ready' && (
              <>
                <p className="text-ak-caption text-ink-muted">{t('fees')}</p>
                <details className="border-line border-t pt-4">
                  <summary className="text-ak-body text-ink ak-focus flex cursor-pointer list-none items-center justify-between gap-3 rounded-sm [&::-webkit-details-marker]:hidden">
                    {t('whatChanges')}
                    <span aria-hidden="true" className="text-ink-muted text-lg">
                      +
                    </span>
                  </summary>
                  <div className="text-ak-caption text-ink-muted space-y-3 pt-3">
                    {(['app', 'activity', 'sending', 'billing'] as const).map(
                      (key) => (
                        <p key={key}>{t('before.' + key)}</p>
                      )
                    )}
                  </div>
                </details>
              </>
            )}
            <Failure state={state} />
            {canGo && (
              <button
                type="button"
                className={cn(
                  akButton({ variant: 'primary', size: 'lg' }),
                  'w-full'
                )}
                disabled={leaving}
                onClick={goToMeta}
              >
                {leaving && (
                  <Loader2
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                )}
                {state.status === 'ready' ? t('launch') : t('tryAgain')}
              </button>
            )}
            {returnUrl && state.status !== 'ready' && (
              <a
                href={returnUrl}
                referrerPolicy="no-referrer"
                className={cn(
                  akButton({
                    variant: canGo ? 'secondary' : 'primary',
                    size: 'lg',
                  }),
                  'w-full'
                )}
              >
                {t('backToSettings')}
              </a>
            )}
          </div>
        )}
      </article>
    </div>
  )
}
