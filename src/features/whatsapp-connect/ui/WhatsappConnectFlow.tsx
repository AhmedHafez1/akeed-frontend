'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  Info,
  Loader2,
  Lock,
  MessageCircle,
  ReceiptText,
  Smartphone,
} from 'lucide-react'
import { resolveSupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, akPill } from '@/shared/ui'
import { useConnectPage, type ConnectPageState } from '../hooks/useConnectPage'
import { metaErrorKey, serverErrorKey } from '../model/signupErrors'
import { ConnectHandshake, type HandshakeState } from './ConnectHandshake'
import { SetupTimeline } from './SetupTimeline'
import { SignupSteps } from './SignupSteps'

const CONSEQUENCES = [
  { key: 'sending', Icon: MessageCircle },
  { key: 'billing', Icon: ReceiptText },
  { key: 'app', Icon: Smartphone },
  { key: 'activity', Icon: Clock },
] as const

/** Which step a state belongs to; null hides the steps. */
const STEP_OF: Record<ConnectPageState['status'], 0 | 1 | 2 | null> = {
  claiming: null,
  missing: null,
  invalid: null,
  ready: 0,
  returned: 0,
  submitting: 1,
  failed: 1,
  connected: 2,
  expired: null,
}

/** A part of the card below the steps, set off by a hairline. */
const SECTION = 'border-line space-y-4 border-t pt-5'

function Notice({
  tone,
  title,
  children,
}: {
  tone: 'info' | 'warning'
  title?: string
  children: ReactNode
}) {
  const Icon = tone === 'info' ? Info : CircleAlert
  return (
    <div
      className={cn(
        'rounded-ak-control flex gap-3 border p-4',
        tone === 'warning' && 'border-ak-warning-line bg-ak-warning-soft',
        tone === 'info' && 'bg-ak-info-soft border-transparent'
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-5 shrink-0',
          tone === 'warning' ? 'text-ak-warning' : 'text-ak-info'
        )}
      />
      <div className="text-ak-body text-ink min-w-0 space-y-1.5">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}

function Busy({ children }: { children: ReactNode }) {
  return (
    <p className="text-ak-body text-ink-muted flex items-center gap-2.5">
      <Loader2
        aria-hidden="true"
        className="text-brand size-4 shrink-0 animate-spin"
      />
      {children}
    </p>
  )
}

/** The card: handshake, title, then what the current state needs. */
function ConnectCard({
  handshake,
  phoneNumber,
  children,
}: {
  handshake: HandshakeState
  phoneNumber?: string | null
  children: ReactNode
}) {
  const t = useTranslations('whatsappConnect')
  return (
    <article className={cn(akCard, 'space-y-5.5 px-5 py-6 sm:px-7 sm:py-7')}>
      <ConnectHandshake state={handshake} phoneNumber={phoneNumber} />
      <header className="space-y-1.5">
        <h1 className="text-ak-title text-ink">{t('title')}</h1>
        <p className="text-ak-body text-ink-muted">{t('intro')}</p>
      </header>
      {children}
    </article>
  )
}

/** What the current state says, below the steps. */
function StatusMessage({ state }: { state: ConnectPageState }) {
  const t = useTranslations('whatsappConnect')
  switch (state.status) {
    case 'claiming':
      return (
        <div className={SECTION}>
          <Busy>{t('claiming')}</Busy>
        </div>
      )
    case 'missing':
      return (
        <Notice tone="info" title={t('missingHeading')}>
          <p>{t('missing')}</p>
        </Notice>
      )
    case 'invalid':
    case 'failed':
      return (
        <Notice tone="warning" title={t('failedHeading')}>
          <p>{t(`errors.${serverErrorKey(state.errorCode)}`)}</p>
          <p>{t('startAgain')}</p>
        </Notice>
      )
    case 'submitting':
      return (
        <div className={SECTION}>
          <Busy>{t('submitting')}</Busy>
        </div>
      )
    case 'connected':
      return (
        <div className={SECTION}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-ak-section text-ink flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="text-brand-ink size-5"
              />
              {t('connected.heading')}
            </h2>
            <span className={akPill({ tone: 'warning' })}>
              {t('setupPending')}
            </span>
          </div>
          <SetupTimeline />
          <p className="text-ak-body text-ink-muted">
            {t('connected.pending')}
          </p>
          <p className="text-ak-caption text-ink-muted">
            {t('connected.close')}
          </p>
        </div>
      )
    case 'returned':
      return state.cancelled ? (
        <Notice tone="info">{t('cancelled')}</Notice>
      ) : (
        <Notice tone="warning" title={t('metaErrorHeading')}>
          <p>{t(`metaErrors.${metaErrorKey(state.metaErrorCode)}`)}</p>
          {state.metaErrorCode && (
            <p className="text-ak-caption text-ink-muted tabular-nums">
              {t('metaErrorCode', { code: state.metaErrorCode })}
            </p>
          )}
        </Notice>
      )
    case 'expired':
      return <Notice tone="warning">{t('expired')}</Notice>
    case 'ready':
      return null
  }
}

/**
 * The connect page's content: checks the link, explains what connecting
 * changes, sends this tab to Meta's signup and reports what the server saved
 * when Meta brings it back.
 */
export function WhatsappConnectFlow() {
  const t = useTranslations('whatsappConnect')
  const locale = resolveSupportedLocale(useLocale())
  const { state, goToMeta } = useConnectPage(locale)
  const outcome = useRef<HTMLDivElement>(null)
  const settled =
    state.status !== 'claiming' &&
    state.status !== 'ready' &&
    state.status !== 'submitting'

  // Screen readers and keyboards land on the result once there is one.
  useEffect(() => {
    if (settled) outcome.current?.focus()
  }, [settled, state.status])

  const step = STEP_OF[state.status]
  const canGo = state.status === 'ready' || state.status === 'returned'
  const leaving = canGo && state.leaving
  return (
    <ConnectCard
      handshake={
        state.status === 'connected'
          ? 'joined'
          : state.status === 'submitting' || leaving
            ? 'waiting'
            : 'idle'
      }
      phoneNumber={
        state.status === 'connected'
          ? state.completion.displayPhoneNumber
          : null
      }
    >
      {step !== null && <SignupSteps current={step} />}

      {state.status === 'ready' && (
        <section aria-labelledby="whatsapp-connect-before" className={SECTION}>
          <h2 id="whatsapp-connect-before" className="text-ak-section text-ink">
            {t('before.heading')}
          </h2>
          <ul className="space-y-3.5">
            {CONSEQUENCES.map(({ key, Icon }) => (
              <li key={key} className="flex gap-3.5">
                <span className="bg-brand-soft text-brand-ink rounded-ak-control flex size-8 shrink-0 items-center justify-center">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <p className="text-ak-body text-ink pt-1">
                  {t(`before.${key}`)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div
        ref={outcome}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="focus:outline-none"
      >
        <StatusMessage state={state} />
      </div>

      {canGo && (
        <div className="space-y-2.5">
          <button
            type="button"
            className={cn(
              akButton({
                variant:
                  state.status === 'returned' && !state.cancelled
                    ? 'secondary'
                    : 'primary',
                size: 'lg',
              }),
              'w-full'
            )}
            onClick={goToMeta}
            disabled={leaving}
            aria-describedby="whatsapp-connect-launch-note"
          >
            {leaving && <Loader2 aria-hidden="true" className="animate-spin" />}
            {state.status === 'ready' ? t('launch') : t('tryAgain')}
          </button>
          <p
            id="whatsapp-connect-launch-note"
            className="text-ak-caption text-ink-muted flex items-center justify-center gap-1.5 text-center"
          >
            <Lock aria-hidden="true" className="size-3.5 shrink-0" />
            {t('before.meta')}
          </p>
        </div>
      )}
    </ConnectCard>
  )
}
