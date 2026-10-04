'use client'

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  AlertCircle,
  Check,
  Clock,
  Eye,
  Link2,
  Loader2,
  ShieldCheck,
  Store,
  XCircle,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  Input,
  Label,
  LoadingButton,
  Skeleton,
  StatusBadge,
  akCard,
} from '@/shared/ui'
import { Frame, Notice, Panel } from '../easyorders/easyOrdersUi'
import {
  toWooCommerceErrorKey,
  type WooCommerceConnectView,
} from './wooCommerce.types'
import { useWooCommerceConnection } from './useWooCommerceConnection'

const STORE_URL_FIELD = 'woocommerce-store-url'
const USES = ['orders', 'notifications', 'outcomes'] as const

/** The store's canonical address, always left to right. */
function StoreAddress({ url }: { url: string }) {
  return (
    <bdi dir="ltr" className="text-ink font-mono font-semibold break-all">
      {url}
    </bdi>
  )
}

/**
 * Connecting a WooCommerce store: enter its address, approve in the store,
 * wait while the store sends Akeed its access, then connected; or denied,
 * unsupported store, or error, one at a time. The authorize link, the keys
 * and the webhook secret never appear on this screen.
 */
export function WooCommerceConnectPage() {
  const t = useTranslations('wooCommerceConnect')
  const locale = useLocale() === 'en' ? 'en' : 'ar'
  const connection = useWooCommerceConnection(locale)
  const { view, status, canManage } = connection
  const [storeUrl, setStoreUrl] = useState('')
  const [missingUrl, setMissingUrl] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownRef = useRef<WooCommerceConnectView | null>(null)

  // Land keyboard and screen-reader users on each new state, not on load.
  useEffect(() => {
    if (view === 'loading') return
    if (shownRef.current !== null && shownRef.current !== view) {
      headingRef.current?.focus()
    }
    shownRef.current = view
  }, [view])

  if (view === 'loading') {
    return (
      <Frame>
        <div aria-busy="true" className={cn(akCard, 'space-y-4 p-6 sm:p-8')}>
          <span className="sr-only">{t('loading')}</span>
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-5 w-[28rem] max-w-full" />
          <Skeleton className="rounded-panel h-40 w-full" />
        </div>
      </Frame>
    )
  }

  const shownStore = status?.connection?.storeUrl ?? status?.storeUrl ?? null
  const heading = (text: ReactNode) => (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className="text-ink text-h3 font-bold focus-visible:outline-none"
    >
      {text}
    </h1>
  )
  const storeLine = shownStore && (
    <dl className="text-sm">
      <dt className="text-ink-muted">{t('storeLabel')}</dt>
      <dd>
        <StoreAddress url={shownStore} />
      </dd>
    </dl>
  )
  const readOnly = !canManage && status && (
    <Notice tone="warning" icon={<Eye aria-hidden="true" />} role="status">
      {t('readOnly')}
    </Notice>
  )
  const cleanup = <p className="text-ink-muted text-sm">{t('cleanup')}</p>
  const tryAgain = (label: string) => (
    <Button
      size="lg"
      className="w-full font-semibold sm:w-auto"
      disabled={!canManage}
      onClick={() => {
        setStoreUrl(shownStore ?? '')
        connection.restart()
      }}
    >
      {label}
    </Button>
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const typed = storeUrl.trim()
    setMissingUrl(!typed)
    if (typed) void connection.connect(typed)
  }
  const startErrorCode = connection.startErrorCode
  const fieldError = missingUrl
    ? t('enterUrl.required')
    : startErrorCode
      ? t(`codes.${toWooCommerceErrorKey(startErrorCode)}`)
      : null

  return (
    <Frame>
      <p className="text-brand-ink text-sm font-semibold">{t('eyebrow')}</p>

      {view === 'loadError' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="destructive">
          {heading(t('loadError.title'))}
          <p className="text-ink-muted text-sm">{t('loadError.body')}</p>
          <Button
            size="lg"
            className="font-semibold"
            onClick={() => void connection.reload()}
          >
            {t('loadError.retry')}
          </Button>
        </Panel>
      )}

      {view === 'unavailable' && (
        <Panel icon={<Clock aria-hidden="true" />} tone="muted">
          {heading(t('unavailable.title'))}
          <p className="text-ink-muted text-sm">{t('unavailable.body')}</p>
        </Panel>
      )}

      {view === 'pilotRequired' && (
        <Panel icon={<ShieldCheck aria-hidden="true" />} tone="muted">
          {heading(t('pilotRequired.title'))}
          <p className="text-ink-muted text-sm">{t('pilotRequired.body')}</p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => void connection.reload()}
          >
            {t('pilotRequired.refresh')}
          </Button>
        </Panel>
      )}

      {view === 'sourceExists' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="muted">
          {heading(t('sourceExists.title'))}
          <p className="text-ink-muted text-sm">{t('sourceExists.body')}</p>
        </Panel>
      )}

      {view === 'enterUrl' && (
        <Panel icon={<Store aria-hidden="true" />} tone="brand">
          {heading(t('enterUrl.title'))}
          <p className="text-ink-muted text-sm">{t('enterUrl.body')}</p>
          <form
            className="space-y-4 text-start"
            onSubmit={submit}
            noValidate
            aria-busy={connection.isStarting}
          >
            <div className="space-y-2">
              <Label
                htmlFor={STORE_URL_FIELD}
                className="text-ink text-sm font-semibold"
              >
                {t('enterUrl.label')}
              </Label>
              <Input
                id={STORE_URL_FIELD}
                name="storeUrl"
                type="url"
                inputMode="url"
                dir="ltr"
                autoComplete="url"
                spellCheck={false}
                placeholder={t('enterUrl.placeholder')}
                value={storeUrl}
                disabled={!canManage || connection.isStarting}
                onChange={(event) => {
                  setStoreUrl(event.target.value)
                  setMissingUrl(false)
                }}
                aria-describedby={`${STORE_URL_FIELD}-hint${fieldError ? ` ${STORE_URL_FIELD}-error` : ''}`}
                aria-invalid={Boolean(fieldError)}
                className="rounded-control bg-card h-12 text-start"
              />
              <p
                id={`${STORE_URL_FIELD}-hint`}
                className="text-ink-muted text-sm"
              >
                {t('enterUrl.hint')}
              </p>
            </div>
            {fieldError && (
              <div id={`${STORE_URL_FIELD}-error`}>
                <Notice
                  tone="destructive"
                  icon={<AlertCircle aria-hidden="true" />}
                >
                  {fieldError}
                </Notice>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-ink text-sm font-semibold">
                {t('enterUrl.usesTitle')}
              </p>
              <ul className="space-y-2">
                {USES.map((use) => (
                  <li
                    key={use}
                    className="text-ink flex items-start gap-2 text-sm"
                  >
                    <Check
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-4 shrink-0"
                    />
                    {t(`enterUrl.uses.${use}`)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-ink-muted text-sm">{t('enterUrl.sender')}</p>
            {readOnly}
            <LoadingButton
              type="submit"
              size="lg"
              className="w-full gap-2 px-8 font-semibold sm:w-auto"
              disabled={!canManage}
              loading={connection.isStarting}
              loadingText={t('enterUrl.checking')}
            >
              <Link2 aria-hidden="true" />
              {t('enterUrl.cta')}
            </LoadingButton>
            <p className="text-ink-muted text-sm">{t('enterUrl.note')}</p>
          </form>
        </Panel>
      )}

      {view === 'waiting' && (
        <Panel
          icon={
            <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
          }
          tone="brand"
        >
          {heading(t('waiting.title'))}
          <p role="status" className="text-ink-muted text-sm">
            {t('waiting.body')}
          </p>
          {storeLine}
          {status?.expiresAt && (
            <p className="text-ink-muted text-sm">
              {t('waiting.expires', {
                time: new Intl.DateTimeFormat(
                  locale === 'ar' ? 'ar-EG' : 'en-US',
                  { hour: 'numeric', minute: '2-digit' }
                ).format(new Date(status.expiresAt)),
              })}
            </p>
          )}
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!canManage}
            onClick={() => {
              setStoreUrl(shownStore ?? '')
              connection.restart()
            }}
          >
            {t('waiting.restart')}
          </Button>
        </Panel>
      )}

      {view === 'denied' && (
        <Panel icon={<XCircle aria-hidden="true" />} tone="muted">
          {heading(t('denied.title'))}
          <p className="text-ink-muted text-sm">{t('denied.body')}</p>
          {storeLine}
          {cleanup}
          {readOnly}
          {tryAgain(t('denied.retry'))}
        </Panel>
      )}

      {view === 'unsupported' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="destructive">
          {heading(t('unsupported.title'))}
          <p role="alert" className="text-ink text-sm">
            {t(`codes.${toWooCommerceErrorKey(status?.lastErrorCode)}`)}
          </p>
          {storeLine}
          <p className="text-ink-muted text-sm">{t('unsupported.nothing')}</p>
          {cleanup}
          {readOnly}
          {tryAgain(t('unsupported.retry'))}
        </Panel>
      )}

      {view === 'error' && (
        <Panel icon={<AlertCircle aria-hidden="true" />} tone="destructive">
          {heading(t('error.title'))}
          <p role="alert" className="text-ink text-sm">
            {status?.state === 'expired'
              ? t('error.expired')
              : t(`codes.${toWooCommerceErrorKey(status?.lastErrorCode)}`)}
          </p>
          {storeLine}
          {cleanup}
          {readOnly}
          {tryAgain(t('error.retry'))}
        </Panel>
      )}

      {view === 'connected' && status?.connection && (
        <Panel icon={<Check aria-hidden="true" strokeWidth={3} />} tone="brand">
          <StatusBadge kind="confirmed">{t('connected.badge')}</StatusBadge>
          {heading(t('connected.title'))}
          {storeLine}
          <p className="text-ink-muted text-sm">{t('connected.body')}</p>
          <p className="text-ink-muted text-sm">{t('connected.next')}</p>
        </Panel>
      )}
    </Frame>
  )
}
