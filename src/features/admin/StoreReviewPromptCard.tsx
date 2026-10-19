'use client'

import { useId, useState } from 'react'
import { Badge, Button, Switch } from '@/shared/ui'
import type {
  AdminReviewPromptEventName,
  AdminReviewPromptPreview,
  AdminReviewPromptState,
  AdminStoreReviewPrompt,
} from './admin.model'
import {
  resetAdminStoreReviewPrompt,
  setAdminStoreReviewPrompt,
  type AdminApiError,
} from './adminApi'
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
  clicked: 'Clicked "Rate Akeed on Shopify"',
  result: 'Shopify answered',
  declined: 'Declined (second "Not now")',
  reset: 'Prompt reset',
}

const STATE_LABELS: Record<AdminReviewPromptState, string> = {
  eligible: 'Eligible',
  snoozed: 'Snoozed',
  declined: 'Declined',
  clicked: 'Clicked',
  reviewed_prompted: 'Review requested',
  reviewed: 'Already reviewed',
  ineligible: 'Ineligible',
}

/** The events kept on the card; the rest stay in the audit trail. */
const RECENT_EVENTS = 5

const eventLabel = (event: { event: string; result_code?: string | null }) => {
  const label =
    EVENT_LABELS[event.event as AdminReviewPromptEventName] ?? event.event
  return event.result_code ? `${label}: ${event.result_code}` : label
}

const describeError = (error: AdminApiError) =>
  error.code === 'REVIEW_PROMPT_UNSUPPORTED_STORE'
    ? 'Review requests are for Shopify stores only.'
    : error.message

/** What the merchant's card would show, in one line. */
function describePreview(preview: AdminReviewPromptPreview): string {
  if (preview.variant !== 'results' || preview.confirmed === null) {
    return 'Plain request (fewer than 10 confirmed orders, or no count)'
  }
  const canceled = preview.canceled ? `, ${preview.canceled} canceled` : ''
  const since = preview.since ? ` since ${formatDateTime(preview.since)}` : ''
  return `Results: ${preview.confirmed} confirmed${canceled}${since}`
}

function describeState(state: AdminStoreReviewPrompt): string {
  if (!state.state) return 'Unknown'
  const label = STATE_LABELS[state.state] ?? state.state
  return state.state === 'snoozed' && state.snoozed_until
    ? `${label} until ${formatDateTime(state.snoozed_until)}`
    : label
}

/**
 * The staff switch that asks a Shopify merchant for an App Store review. The
 * switch opens the prompt; only the merchant closes it. Switching off and on
 * does not ask again a store that snoozed, declined or answered; "Reset
 * prompt" does.
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
  const [error, setError] = useState<{
    failure: AdminApiError
    retry: () => void
  } | null>(null)
  const recent = [...state.events]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, RECENT_EVENTS)
  const canReset = state.state !== undefined && state.state !== 'eligible'

  const toggle = async (enabled: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const response = await setAdminStoreReviewPrompt(integrationId, enabled)
      setState(response.review_prompt)
    } catch (cause) {
      console.error('[Admin] Review prompt switch failed', cause)
      const failure = toAdminApiError(cause)
      // The merchant declined since this page loaded. The locked switch and
      // its note say so; there is nothing to retry.
      if (failure.code === 'REVIEW_PROMPT_OPTED_OUT') {
        setState((current) => ({
          ...current,
          enabled: false,
          opted_out: true,
        }))
      } else {
        setError({ failure, retry: () => void toggle(enabled) })
      }
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await resetAdminStoreReviewPrompt(integrationId)
      setState(response.review_prompt)
    } catch (cause) {
      console.error('[Admin] Review prompt reset failed', cause)
      setError({ failure: toAdminApiError(cause), retry: () => void reset() })
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
              {state.enabled ? 'On' : 'Off'}
            </Badge>
            {state.opted_out && <Badge variant="warning">Opted out</Badge>}
          </h2>
          <p id={descriptionId} className="text-muted-foreground mt-1 text-xs">
            {state.opted_out
              ? `The merchant declined${
                  state.opted_out_at
                    ? ` on ${formatDateTime(state.opted_out_at)}`
                    : ''
                }, so the switch stays off. Reset the prompt only if the merchant asks to be asked again.`
              : 'While on, owners and admins see a review card on the Dashboard and Confirmations pages. "Not now" snoozes it for 14 days; a second "Not now" declines. Switching off and on does not ask again; reset the prompt for that.'}
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
            message={describeError(error.failure)}
            requestId={error.failure.requestId}
            onRetry={error.retry}
          />
        </div>
      )}

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        {state.state && (
          <div>
            <dt className="text-muted-foreground">Prompt state</dt>
            <dd className="text-foreground">{describeState(state)}</dd>
          </div>
        )}
        {state.preview && (
          <div>
            <dt className="text-muted-foreground">Merchant sees</dt>
            <dd className="text-foreground">
              {describePreview(state.preview)}
            </dd>
          </div>
        )}
        {state.shown_count !== undefined && (
          <div>
            <dt className="text-muted-foreground">Times shown</dt>
            <dd className="text-foreground">
              {state.shown_count}
              {state.last_shown_at &&
                ` · last ${formatDateTime(state.last_shown_at)}`}
            </dd>
          </div>
        )}
        {state.last_result_code !== undefined && (
          <div>
            <dt className="text-muted-foreground">Last Shopify result</dt>
            <dd className="text-foreground">
              {state.last_result_code ? (
                <code dir="ltr">{state.last_result_code}</code>
              ) : (
                'None yet'
              )}
            </dd>
          </div>
        )}
        {state.snooze_count !== undefined && (
          <div>
            <dt className="text-muted-foreground">Snoozes</dt>
            <dd className="text-foreground">{state.snooze_count}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Last action</dt>
          <dd className="text-foreground">
            {state.last_event
              ? `${eventLabel(state.last_event)} by ${state.last_event.actor_type} · ${formatDateTime(state.last_event.at)}`
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

      {canReset && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => void reset()}
          >
            Reset prompt
          </Button>
          <span className="text-muted-foreground text-xs">
            Makes the store eligible again; the merchant sees the card while the
            switch is on.
          </span>
        </div>
      )}

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
                  {eventLabel(event)}
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
