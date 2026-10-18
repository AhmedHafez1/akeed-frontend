'use client'

/* eslint-disable @next/next/no-img-element -- the merchant's own upload, served from storage */

import { useId, useState } from 'react'
import { Badge, Switch } from '@/shared/ui'
import type { AdminStoreLogoHeader } from './admin.model'
import { setAdminStoreLogoHeader, type AdminApiError } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'
import { formatDateTime } from './AdminStoreUi'
import { toAdminApiError } from './useStandaloneBillingAccount'

/**
 * The store's logo, its banner and the staff switch (on by default) that
 * sends the banner as the image header. Lists every image twin staff registered: a template
 * without an active, approved twin keeps going out as text.
 */
export function StoreLogoHeaderCard({
  integrationId,
  initial,
}: {
  integrationId: string
  initial: AdminStoreLogoHeader
}) {
  const descriptionId = useId()
  const [state, setState] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const sendable = state.image_twins.filter(
    (twin) => twin.is_active && twin.review_status === 'approved'
  )

  const toggle = async (enabled: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const response = await setAdminStoreLogoHeader(integrationId, enabled)
      setState(response.logo_header)
    } catch (cause) {
      console.error('[Admin] Logo header switch failed', cause)
      setError(toAdminApiError(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Logo header</h2>
          <p id={descriptionId} className="text-muted-foreground mt-1 text-xs">
            On for every store by default. While on, messages whose template has
            an active, approved image twin carry the store&apos;s banner. Switch
            it off to send text only and hide the logo card in Settings.
          </p>
        </div>
        <Switch
          checked={state.enabled}
          disabled={saving}
          label="Send the store's banner as the message image header"
          describedBy={descriptionId}
          onChange={(enabled) => void toggle(enabled)}
        />
      </div>

      {error && (
        <div className="mt-3">
          <AdminErrorPanel
            compact
            message={error.message}
            requestId={error.requestId}
            onRetry={() => void toggle(!state.enabled)}
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
        <div className="border-border bg-muted flex size-24 items-center justify-center overflow-hidden rounded-xl border">
          {state.logo_url ? (
            <img
              src={state.logo_url}
              alt="Store logo"
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <span className="text-muted-foreground text-xs">No logo</span>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          {state.banner_url ? (
            <img
              src={state.banner_url}
              alt="Message banner"
              className="border-border aspect-[1200/628] w-full max-w-sm rounded-lg border object-cover"
            />
          ) : (
            <p className="text-muted-foreground text-xs">
              No banner yet. One is built when the merchant uploads a logo.
            </p>
          )}
          {state.updated_at && (
            <p className="text-muted-foreground text-xs">
              Logo saved {formatDateTime(state.updated_at)}
            </p>
          )}
        </div>
      </div>

      <div className="border-border mt-4 border-t pt-4">
        <h3 className="text-foreground text-xs font-semibold">
          Image twins ({sendable.length} sendable of {state.image_twins.length})
        </h3>
        {state.image_twins.length === 0 ? (
          <p className="text-muted-foreground mt-1 text-xs">
            None registered. Every message goes out as text. See the WhatsApp
            template runbook, section 10.
          </p>
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {state.image_twins.map((twin) => (
              <li
                key={twin.template_name}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="text-foreground font-mono" dir="ltr">
                    {twin.template_name}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    · twin of{' '}
                    <span className="font-mono" dir="ltr">
                      {twin.twin_of_key}
                    </span>
                  </span>
                </span>
                <span className="flex gap-1.5">
                  <Badge variant={twin.is_active ? 'success' : 'neutral'}>
                    {twin.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge
                    variant={
                      twin.review_status === 'approved' ? 'success' : 'warning'
                    }
                  >
                    {twin.review_status ?? 'Not synced'}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
