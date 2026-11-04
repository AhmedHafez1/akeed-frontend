'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { AdminStoreWhatsapp, AdminWhatsappConnection } from './admin.model'
import { getAdminWhatsappConnection } from './adminApi'
import {
  formatDateTime,
  senderLabel,
  whatsappReasonLabel,
  WhatsappStateBadge,
} from './AdminStoreUi'
import { toAdminApiError } from './useStandaloneBillingAccount'

type Load =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'error' }
  | { status: 'ready'; connection: AdminWhatsappConnection }

const DEGRADED: Record<string, string> = {
  payment:
    'Payment warning. The connection is active; own-number sending is temporarily unavailable.',
  credentials:
    'Credentials expired. The connection needs renewing; confirmations go from Akeed.',
  restricted:
    'Restricted by Meta. Own-number sending is unavailable; confirmations go from Akeed.',
}

/**
 * The store's own number for staff: the connection and its readiness now,
 * kept apart from the sender the last accepted message actually used.
 */
export function AdminWhatsappSenderCard({
  orgId,
  whatsapp,
  revision,
}: {
  orgId: string
  whatsapp: AdminStoreWhatsapp | undefined
  revision: number
}) {
  const [load, setLoad] = useState<Load>({ status: 'loading' })

  useEffect(() => {
    let current = true
    getAdminWhatsappConnection(orgId)
      .then((connection) => {
        if (current) setLoad({ status: 'ready', connection })
      })
      .catch((cause: unknown) => {
        if (!current) return
        setLoad(
          toAdminApiError(cause).status === 404
            ? { status: 'none' }
            : { status: 'error' }
        )
      })
    return () => {
      current = false
    }
  }, [orgId, revision])

  const connection = load.status === 'ready' ? load.connection : null
  const lastReason = whatsappReasonLabel(whatsapp?.lastSenderReason ?? null)
  const degraded = connection?.health.degradedClass ?? null

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold">
            WhatsApp sender
          </h2>
          <p className="text-foreground mt-2 text-lg font-semibold tabular-nums">
            {connection?.displayPhoneNumber ? (
              <span dir="ltr">{connection.displayPhoneNumber}</span>
            ) : load.status === 'none' ? (
              'Akeed number only'
            ) : (
              '—'
            )}
          </p>
        </div>
        <WhatsappStateBadge
          state={connection?.state ?? whatsapp?.state ?? null}
        />
      </div>
      {load.status === 'error' && (
        <p
          role="alert"
          className="text-destructive-subtle-foreground mt-3 text-xs"
        >
          The connection details couldn’t load. The fields below come from the
          store list.
        </p>
      )}
      <dl className="border-border mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-xs">
            Last accepted confirmation
          </dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {senderLabel(whatsapp?.lastSender ?? null)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Reason</dt>
          <dd className="text-foreground mt-1 text-sm font-medium">
            {lastReason ?? whatsappReasonLabel(whatsapp?.reason ?? null) ?? '—'}
          </dd>
        </div>
        {connection && (
          <div>
            <dt className="text-muted-foreground text-xs">
              Templates ready now
            </dt>
            <dd className="text-foreground mt-1 text-sm font-medium tabular-nums">
              {connection.templates.ready} / {connection.templates.total}
              {connection.templates.pending > 0 &&
                ` · ${connection.templates.pending} pending`}
              {connection.templates.rejected > 0 &&
                ` · ${connection.templates.rejected} rejected`}
            </dd>
          </div>
        )}
        {connection && (
          <div>
            <dt className="text-muted-foreground text-xs">Quality</dt>
            <dd className="text-foreground mt-1 text-sm font-medium">
              {connection.health.qualityRating ?? 'Unknown'}
            </dd>
          </div>
        )}
      </dl>
      {degraded && (
        <p className="border-warning-border bg-warning-subtle text-warning-subtle-foreground mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {DEGRADED[degraded] ??
            `Degraded (${degraded}). Own-number sending is unavailable; confirmations go from Akeed.`}
        </p>
      )}
      <p className="text-muted-foreground mt-4 text-xs">
        The last sender is history. Readiness comes from the connection and each
        template now.
        {connection?.health.lastCheckedAt &&
          ` Last health observation: ${formatDateTime(connection.health.lastCheckedAt)}.`}
      </p>
    </section>
  )
}
