'use client'

import { useId, useState } from 'react'
import { Badge, Switch } from '@/shared/ui'
import type {
  AdminReviewPromptEventName,
  AdminStoreReviewPrompt,
} from './admin.model'
import { setAdminStoreReviewPrompt, type AdminApiError } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'
import { formatDateTime } from './AdminStoreUi'
import { toAdminApiError } from './useStandaloneBillingAccount'

const EVENT_LABELS: Record<AdminReviewPromptEventName, string> = {
  enabled: 'Turned on',
  shown: 'Shown to merchant',
  review_clicked: 'Opened the review page',
  snoozed: 'Not now',
  dismissed: 'Dismissed',
  dont_ask_again: "Don't ask again",
  admin_disabled: 'Turned off',
}

/** The events kept on the card; the rest stay in the audit trail. */
const RECENT_EVENTS = 5

const eventLabel = (event: string) =>
  EVENT_LABELS[event as AdminReviewPromptEventName] ?? event

const describeError = (error: AdminApiError) =>
  error.code === 'REVIEW_PROMPT_UNSUPPORTED_STORE'
    ? 'Review requests are for Shopify stores only.'
    : error.message

/**
 * The staff switch that asks a Shopify merchant, once, for an App Store
 * review. The merchant's dashboard shows the request until they answer it;
 * "Don't ask again" is final and locks the switch.
 */
export function StoreReviewPromptCard({
  integrationId,
  initial,
}: {
  integrationId: string
  initial: AdminStoreReviewPrompt
}) {
  const descriptionId = useId()
  const [state, setState] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const recent = [...state.events]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, RECENT_EVENTS)

  const toggle = async (enabled: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const response = await setAdminStoreReviewPrompt(integrationId, enabled)
      setState(response.review_prompt)
    } catch (cause) {
      console.error('[Admin] Review prompt switch failed', cause)
      const failure = toAdminApiError(cause)
      // The merchant opted out since this page loaded. The locked switch and
      // its note say so; there is nothing to retry.
      if (failure.code === 'REVIEW_PROMPT_OPTED_OUT') {
        setState((current) => ({ ...current, enabled: false, opted_out: true }))
      } else {
        setError(failure)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            App Store review request
            <Badge variant={state.enabled ? 'info' : 'neutral'}>
              {state.enabled ? 'Pending' : 'Off'}
            </Badge>
            {state.opted_out && <Badge variant="warning">Opted out</Badge>}
          </h2>
          <p id={descriptionId} className="text-muted-foreground mt-1 text-xs">
            {state.opted_out
              ? `The merchant chose "Don't ask again"${
                  state.opted_out_at
                    ? ` on ${formatDateTime(state.opted_out_at)}`
                    : ''
                }. That choice is final, so this store can't be asked again.`
              : 'While on, the merchant sees a neutral banner on the dashboard asking for an App Store review, until they answer it once. Switch it off to withdraw an unanswered request.'}
          </p>
        </div>
        <Switch
          checked={state.enabled}
          disabled={saving || state.opted_out}
          label="Review Prompt Enabled"
          describedBy={descriptionId}
          onChange={(enabled) => void toggle(enabled)}
        />
      </div>

      {error && (
        <div className="mt-3">
          <AdminErrorPanel
            compact
            message={describeError(error)}
            requestId={error.requestId}
            onRetry={() => void toggle(!state.enabled)}
          />
        </div>
      )}

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Last action</dt>
          <dd className="text-foreground">
            {state.last_event
              ? `${eventLabel(state.last_event.event)} by ${state.last_event.actor_type} · ${formatDateTime(state.last_event.at)}`
              : 'None yet'}
          </dd>
        </div>
        {state.enabled && state.enabled_at && (
          <div>
            <dt className="text-muted-foreground">Turned on</dt>
            <dd className="text-foreground">
              {formatDateTime(state.enabled_at)}
              {state.enabled_by && (
                <>
                  {' by '}
                  <span dir="ltr">{state.enabled_by}</span>
                </>
              )}
            </dd>
          </div>
        )}
      </dl>

      {recent.length > 0 && (
        <div className="border-border mt-4 border-t pt-4">
          <h3 className="text-foreground text-xs font-semibold">
            Recent events
          </h3>
          <ul className="divide-border mt-2 divide-y">
            {recent.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
              >
                <span className="text-foreground">
                  {eventLabel(event.event)}
                  <span className="text-muted-foreground">
                    {' '}
                    · {event.actor_type}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {formatDateTime(event.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
