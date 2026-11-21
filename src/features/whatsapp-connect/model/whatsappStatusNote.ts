import type { WhatsappConnectionStatus } from '../api/whatsappConnectApi'
import type { ProgressIssue } from './whatsappProgress'
import type { ConnectionView } from './whatsappTabState'

/**
 * The one sentence under the status area: which number sends messages right
 * now, and why. It follows what the backend's sender choice would do, so it
 * never says "your number" while a dispatch would still go out from Akeed's.
 */

export type WhatsappStatus =
  | 'not_connected'
  | 'setting_up'
  | 'awaiting_templates'
  | 'active'
  | 'paused'
  | 'sending_issue'
  | 'templates_rejected'
  | 'disconnected'

/** Message key under `whatsappConnect.tab.statusNote`. */
export type StatusNoteKey =
  | 'notConnected'
  | 'settingUp'
  | 'awaitingTemplates'
  | 'awaitingTemplatesPartial'
  | 'active'
  | 'sendingIssue.credentials'
  | 'sendingIssue.payment'
  | 'sendingIssue.restricted'
  | 'sendingIssue.unavailable'
  | 'sendingIssue.setup'
  | 'templatesRejected'
  | 'templatesRejectedAkeed'
  | 'disconnected'

export interface WhatsappStatusNote {
  status: WhatsappStatus
  /** Null when the status rows already say it, so no caption is shown. */
  key: StatusNoteKey | null
  /** The connected number, or null when none is known. */
  number: string | null
  /** Templates whose messages go from the merchant's number now. */
  approved: number
  total: number
  /**
   * What to do about it, as an existing progress message. Set only when no
   * status row already shows that message beside its own button.
   */
  action: ProgressIssue | null
}

type NoteView = Pick<
  ConnectionView,
  | 'state'
  | 'phone'
  | 'readiness'
  | 'templates'
  | 'readyCount'
  | 'progress'
  | 'reconnectNeedsDisconnect'
>

const SENDING_ISSUE: Record<
  string,
  { key: StatusNoteKey; action: ProgressIssue | null }
> = {
  credentials: { key: 'sendingIssue.credentials', action: 'credentials' },
  payment: { key: 'sendingIssue.payment', action: 'payment' },
  restricted: { key: 'sendingIssue.restricted', action: 'restricted' },
}
const SENDING_ISSUE_OTHER = {
  key: 'sendingIssue.unavailable' as const,
  // The note already says it; the progress message would repeat it.
  action: null,
}

export const NOT_CONNECTED_NOTE: WhatsappStatusNote = {
  status: 'not_connected',
  key: 'notConnected',
  number: null,
  approved: 0,
  total: 0,
  action: null,
}

export function whatsappStatusNote(
  view: NoteView,
  connection: WhatsappConnectionStatus
): WhatsappStatusNote {
  const total = view.templates.length
  const note = (
    status: WhatsappStatus,
    key: StatusNoteKey | null,
    action: ProgressIssue | null = null
  ): WhatsappStatusNote => ({
    status,
    key,
    number: view.phone,
    approved: view.readyCount,
    total,
    action:
      action && !view.progress.rows.some((row) => row.issue === action)
        ? action
        : null,
  })

  if (view.state === 'disconnected' || view.state === 'offboarded')
    return note('disconnected', 'disconnected')
  // The sending row already says it is paused and that Akeed sends.
  if (view.readiness === 'sendingOff') return note('paused', null)

  const { setup, health } = connection
  const degraded = health.degradedClass
  const sendingIssue = (name: string) => {
    const found = SENDING_ISSUE[name] ?? SENDING_ISSUE_OTHER
    return note('sending_issue', found.key, found.action)
  }

  if (
    setup.status === 'exhausted' ||
    (setup.status === 'failed' && !setup.retryAt)
  )
    return note('sending_issue', 'sendingIssue.setup')
  if (view.state === 'connecting' || setup.status !== 'complete')
    return note('setting_up', 'settingUp')
  if (view.reconnectNeedsDisconnect || degraded === 'credentials')
    return sendingIssue('credentials')

  const rejected = view.templates.some((row) =>
    ['rejected', 'paused', 'recategorized'].includes(row.status)
  )
  const waiting = view.templates.some(
    (row) => row.status === 'pending' || row.status === 'missing'
  )

  if (view.state !== 'active') {
    // A number still being verified: a pending review explains why Akeed
    // sends, whatever Meta's first health reads said.
    if (total === 0) return note('setting_up', 'settingUp')
    if (rejected) return note('templates_rejected', 'templatesRejectedAkeed')
    if (waiting) return note('awaiting_templates', 'awaitingTemplates')
    return degraded ? sendingIssue(degraded) : note('setting_up', 'settingUp')
  }

  if (degraded) return sendingIssue(degraded)
  if (view.readiness === 'ready') return note('active', 'active')
  if (rejected)
    return note(
      'templates_rejected',
      view.readyCount > 0 ? 'templatesRejected' : 'templatesRejectedAkeed'
    )
  return note(
    'awaiting_templates',
    view.readyCount > 0 ? 'awaitingTemplatesPartial' : 'awaitingTemplates'
  )
}
