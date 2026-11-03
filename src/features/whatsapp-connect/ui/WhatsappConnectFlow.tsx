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
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, akPill } from '@/shared/ui'
import type { ConnectTicketClaimed } from '../api/whatsappConnectApi'
import { useConnectTicket } from '../hooks/useConnectTicket'
import { useEmbeddedSignup } from '../hooks/useEmbeddedSignup'
import { metaErrorKey, serverErrorKey } from '../model/signupErrors'
import type { SignupPhase } from '../model/signupMachine'
import { ConnectHandshake, type HandshakeState } from './ConnectHandshake'
import { SetupTimeline } from './SetupTimeline'
import { SignupSteps } from './SignupSteps'

const CONSEQUENCES = [
  { key: 'sending', Icon: MessageCircle },
  { key: 'billing', Icon: ReceiptText },
  { key: 'app', Icon: Smartphone },
  { key: 'activity', Icon: Clock },
] as const

/** Which step a phase belongs to; null hides the steps. */
const STEP_OF: Record<SignupPhase, 0 | 1 | 2 | null> = {
  idle: 0,
  cancelled: 0,
  noCode: 0,
  metaError: 0,
  inMeta: 1,
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

function SignupPanel({ claim }: { claim: ConnectTicketClaimed }) {
  const t = useTranslations('whatsappConnect')
  const locale = useLocale()
  const signup = useEmbeddedSignup(claim, locale)
  const { state } = signup
  const outcome = useRef<HTMLDivElement>(null)
  const settled =
    state.phase !== 'idle' &&
    state.phase !== 'inMeta' &&
    state.phase !== 'submitting'

  // Screen readers and keyboards land on the result once there is one.
  useEffect(() => {
    if (settled) outcome.current?.focus()
  }, [settled, state.phase])

  let status: ReactNode = null
  switch (state.phase) {
    case 'inMeta':
      status = (
        <div className={SECTION}>
          <Busy>{t('inMeta')}</Busy>
          <span className={akPill({ tone: 'neutral' })}>{t('waiting')}</span>
        </div>
      )
      break
    case 'submitting':
      status = (
        <div className={SECTION}>
          <Busy>{t('submitting')}</Busy>
        </div>
      )
      break
    case 'connected':
      status = (
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
      break
    case 'cancelled':
      status = <Notice tone="info">{t('cancelled')}</Notice>
      break
    case 'noCode':
      status = <Notice tone="warning">{t('noCode')}</Notice>
      break
    case 'metaError':
      status = (
        <Notice tone="warning" title={t('metaErrorHeading')}>
          <p>{t(`metaErrors.${metaErrorKey(state.metaErrorCode)}`)}</p>
          {state.metaErrorCode && (
            <p className="text-ak-caption text-ink-muted tabular-nums">
              {t('metaErrorCode', { code: state.metaErrorCode })}
            </p>
          )}
        </Notice>
      )
      break
    case 'failed':
      status = (
        <Notice tone="warning" title={t('failedHeading')}>
          <p>{t(`errors.${serverErrorKey(state.errorCode)}`)}</p>
          <p>{t('startAgain')}</p>
        </Notice>
      )
      break
    case 'expired':
      status = <Notice tone="warning">{t('expired')}</Notice>
      break
  }

  const step = STEP_OF[state.phase]
  const showLaunch = signup.canLaunch || state.phase === 'idle'
  return (
    <ConnectCard
      handshake={
        state.phase === 'connected'
          ? 'joined'
          : state.phase === 'inMeta' || state.phase === 'submitting'
            ? 'waiting'
            : 'idle'
      }
      phoneNumber={state.completion?.displayPhoneNumber}
    >
      {step !== null && <SignupSteps current={step} />}

      {state.phase === 'idle' && (
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
        {status}
      </div>

      {showLaunch && (
        <div className="space-y-2.5">
          {signup.sdkStatus === 'failed' ? (
            <Notice tone="warning">
              <p>{t('sdkFailed')}</p>
              <button
                type="button"
                className={cn(
                  akButton({ variant: 'secondary', size: 'row' }),
                  'mt-1.5'
                )}
                onClick={signup.retrySdk}
              >
                {t('retrySdk')}
              </button>
            </Notice>
          ) : (
            <button
              type="button"
              className={cn(
                akButton({
                  variant:
                    state.phase === 'metaError' ? 'secondary' : 'primary',
                  size: 'lg',
                }),
                'w-full'
              )}
              onClick={signup.launch}
              disabled={!signup.canLaunch}
              aria-describedby="whatsapp-connect-launch-note"
            >
              {signup.sdkStatus === 'loading' && (
                <Loader2 aria-hidden="true" className="animate-spin" />
              )}
              {state.phase === 'idle' ? t('launch') : t('tryAgain')}
            </button>
          )}
          <p
            id="whatsapp-connect-launch-note"
            className="text-ak-caption text-ink-muted flex items-center justify-center gap-1.5 text-center"
          >
            {signup.sdkStatus === 'loading' ? (
              t('sdkLoading')
            ) : state.phase === 'idle' ? (
              <>
                <Lock aria-hidden="true" className="size-3.5 shrink-0" />
                {t('before.meta')}
              </>
            ) : null}
          </p>
        </div>
      )}
    </ConnectCard>
  )
}

/**
 * The connect page's content: checks the link, explains what connecting
 * changes, runs Meta's signup and reports what the server saved.
 */
export function WhatsappConnectFlow() {
  const t = useTranslations('whatsappConnect')
  const ticket = useConnectTicket()

  if (ticket.status === 'ready') return <SignupPanel claim={ticket.claim} />
  return (
    <ConnectCard handshake="idle">
      {ticket.status === 'claiming' && (
        <div role="status" aria-live="polite" className={SECTION}>
          <Busy>{t('claiming')}</Busy>
        </div>
      )}
      {ticket.status === 'missing' && (
        <Notice tone="info" title={t('missingHeading')}>
          <p>{t('missing')}</p>
        </Notice>
      )}
      {ticket.status === 'invalid' && (
        <Notice tone="warning" title={t('failedHeading')}>
          <p>{t(`errors.${serverErrorKey(ticket.errorCode)}`)}</p>
          <p>{t('startAgain')}</p>
        </Notice>
      )}
    </ConnectCard>
  )
}
