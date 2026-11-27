'use client'

import {
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  Truck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { akButton, akLink, notify } from '@/shared/ui'
import { StatusBadge, type StatusBadgeKind } from '@/shared/ui/status-badge'
import { customerContact } from '@/features/dashboard/lib/customerContact'
import type { ShippingDeliveryBadge } from '@/features/dashboard/domain/shippingStatus'
import { useShippingDetails } from '@/features/dashboard/domain/useShippingDetails'
import { useShippingResolve } from '@/features/dashboard/domain/useShippingResolve'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

const KINDS: Record<ShippingDeliveryBadge, StatusBadgeKind> = {
  sent: 'pending',
  undeliverable: 'noWhatsApp',
  failedToSend: 'failed',
  notSent: 'scheduled',
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground mt-1 text-sm">{children}</dd>
    </div>
  )
}

/** The open request, with "Mark done" for owners and admins and a chat link. */
function OpenRequestNote({
  verification,
  text,
  canAct,
}: {
  verification: VerificationItem
  text: string
  canAct: boolean
}) {
  const t = useTranslations('dashboard.shipping')
  const tActions = useTranslations('dashboard.overview.needsAction.actions')
  const { resolve, pendingId } = useShippingResolve({
    onDone: (message) => notify.success({ message, id: 'shipping-resolve' }),
    onError: (message) => notify.error({ message, id: 'shipping-resolve' }),
  })
  const contact =
    verification.action_reason === 'delivery_request'
      ? customerContact(verification.customer_phone)
      : null
  const isResolving = pendingId === verification.id
  return (
    <div
      role="note"
      className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-xl border px-4 py-3"
    >
      <p className="text-sm font-medium">{text}</p>
      {canAct && <p className="mt-0.5 text-xs">{t('details.contactHint')}</p>}
      {(canAct || contact) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canAct && (
            <button
              type="button"
              disabled={isResolving}
              onClick={() => void resolve(verification.id)}
              className={akButton({ variant: 'primary', size: 'row' })}
            >
              {isResolving ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Check aria-hidden="true" strokeWidth={2.5} />
              )}
              {t('markDone')}
            </button>
          )}
          {contact && (
            <a
              href={contact.whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={akButton({ variant: 'secondary', size: 'row' })}
            >
              <MessageCircle aria-hidden="true" />
              {tActions('whatsapp')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The order's Shipped message: why it was sent, its status or why it was not
 * sent, tracking and the customer's reply. An open request, or a customer the
 * message did not reach, offers "Mark done" to owners and admins.
 */
export function ShippingSection({
  verification,
  timeZone,
  canAct,
}: {
  verification: VerificationItem
  timeZone: string
  canAct: boolean
}) {
  const t = useTranslations('dashboard.shipping')
  const view = useShippingDetails(
    verification.shipping,
    verification.action_reason,
    timeZone
  )
  if (!view) return null

  return (
    <section
      aria-labelledby="verification-shipping-title"
      className="space-y-3"
    >
      <h3
        id="verification-shipping-title"
        className="text-foreground flex items-center gap-2 font-semibold"
      >
        <Truck aria-hidden="true" className="size-4" />
        {t('details.title')}
      </h3>
      {view.open && (
        <OpenRequestNote
          verification={verification}
          text={view.open}
          canAct={canAct}
        />
      )}
      <dl className="bg-muted grid grid-cols-2 gap-4 rounded-xl p-4">
        <Fact label={t('details.trigger')}>
          <bdi>{view.trigger}</bdi>
        </Fact>
        <Fact label={t('details.statusLabel')}>
          <span className="flex flex-col items-start gap-1">
            <StatusBadge
              kind={view.badge ? KINDS[view.badge] : 'scheduled'}
              icon={false}
            >
              {view.status}
            </StatusBadge>
            <span className="text-muted-foreground text-xs">
              {view.reason ?? view.time}
            </span>
          </span>
        </Fact>
        {view.tracking && (
          <Fact label={t('details.tracking')}>
            <span className="flex flex-wrap items-center gap-2">
              {view.tracking.number && (
                <bdi dir="ltr" className="tabular-nums">
                  {view.tracking.number}
                </bdi>
              )}
              {view.tracking.url && (
                <a
                  href={view.tracking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(akLink, 'text-xs')}
                >
                  {t('details.track')}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              )}
            </span>
          </Fact>
        )}
        {view.reply && (
          <Fact label={t('details.reply')}>
            <span className="font-semibold">{view.reply}</span>
          </Fact>
        )}
      </dl>
      {view.resolved && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CheckCircle2
            aria-hidden="true"
            className="text-brand-ink size-3.5"
          />
          {view.resolved}
        </p>
      )}
    </section>
  )
}
