import type { WhatsappConnectionStatus } from '../api/whatsappConnectApi'
import type { ConnectionView } from './whatsappTabState'

export type ProgressStatus =
  | 'connected'
  | 'reconnect'
  | 'preparing'
  | 'pending'
  | 'someApproved'
  | 'approved'
  | 'waiting'
  | 'someMessages'
  | 'ready'
  | 'attention'
  | 'paused'
export type ProgressIssue =
  | 'payment'
  | 'credentials'
  | 'restricted'
  | 'quality'
  | 'unavailable'
  | 'templates'
  | 'setup'
  | 'retry'
  | 'sendingOff'
  | 'inactive'
export interface WhatsappProgressRow {
  id: 'number' | 'templates' | 'sending'
  status: ProgressStatus
  tone: 'success' | 'warning' | 'info' | 'neutral'
  done: boolean
  issue?: ProgressIssue
  action?: 'whatsapp_manager' | 'support' | 'reconnect'
}
export interface WhatsappProgress {
  rows: WhatsappProgressRow[]
}

/** Poll background setup, never disconnected numbers or exhausted setup jobs. */
export function hasPendingWhatsappSetup(
  connection: WhatsappConnectionStatus | null | undefined
): boolean {
  if (
    !connection ||
    connection.state === 'disconnected' ||
    connection.state === 'offboarded' ||
    connection.setup.status === 'exhausted'
  )
    return false
  if (connection.state !== 'active' || connection.templateDetails.length === 0)
    return true
  return connection.templateDetails.some((row) =>
    ['pending', 'missing', 'draft', 'submitting', 'in_review'].includes(
      row.status
    )
  )
}

/** Current provider facts only. Approval and actual sending readiness remain separate. */
export function whatsappProgress(
  view: ConnectionView,
  connection: WhatsappConnectionStatus
): WhatsappProgress {
  if (view.state === 'disconnected' || view.state === 'offboarded')
    return { rows: [] }
  const rows = connection.templateDetails
  const approved = rows.filter(
    (row) => row.status === 'approved' && row.category === 'utility'
  ).length
  const allApproved = rows.length > 0 && approved === rows.length
  const templateIssue = rows.some(
    (row) =>
      ['rejected', 'paused', 'disabled'].includes(row.status) ||
      (row.status === 'approved' && row.category !== 'utility')
  )
  const pending = rows.some((row) =>
    ['pending', 'in_review'].includes(row.status)
  )
  const setupBlocked =
    connection.setup.status === 'exhausted' ||
    (connection.setup.status === 'failed' && !connection.setup.retryAt)
  const reconnect =
    view.reconnectNeedsDisconnect || view.readiness === 'degradedCredentials'
  const number: WhatsappProgressRow = {
    id: 'number',
    status: reconnect ? 'reconnect' : 'connected',
    tone: reconnect ? 'warning' : 'success',
    done: !reconnect,
    ...(reconnect
      ? ({ issue: 'credentials', action: 'reconnect' } as const)
      : {}),
  }
  const templates: WhatsappProgressRow = {
    id: 'templates',
    status: setupBlocked
      ? 'attention'
      : allApproved
        ? 'approved'
        : approved > 0
          ? 'someApproved'
          : templateIssue
            ? 'attention'
            : pending
              ? 'pending'
              : 'preparing',
    tone:
      setupBlocked || (templateIssue && approved === 0)
        ? 'warning'
        : allApproved
          ? 'success'
          : approved > 0
            ? 'info'
            : 'warning',
    done: allApproved && !setupBlocked,
    ...(setupBlocked
      ? ({ issue: 'setup', action: 'support' } as const)
      : templateIssue
        ? ({ issue: 'templates', action: 'support' } as const)
        : connection.setup.retryAt
          ? ({ issue: 'retry' } as const)
          : {}),
  }
  const sending: WhatsappProgressRow = {
    id: 'sending',
    status:
      view.readiness === 'ready'
        ? 'ready'
        : view.readiness === 'templatesVary'
          ? 'someMessages'
          : view.readiness === 'preparing'
            ? 'preparing'
            : 'waiting',
    tone:
      view.readiness === 'ready'
        ? 'success'
        : view.readiness === 'templatesVary'
          ? 'info'
          : 'neutral',
    done: view.readiness === 'ready',
  }
  const issue: ProgressIssue | undefined =
    view.readiness === 'sendingOff'
      ? 'sendingOff'
      : view.readiness === 'degradedPayment'
        ? 'payment'
        : view.readiness === 'degradedCredentials'
          ? 'credentials'
          : view.readiness === 'degradedRestricted'
            ? 'restricted'
            : view.readiness === 'degradedOther'
              ? 'unavailable'
              : view.banners.some((banner) => banner.key === 'quality_drop.red')
                ? 'quality'
                : undefined
  if (issue) {
    sending.status = issue === 'sendingOff' ? 'paused' : 'attention'
    sending.tone = issue === 'sendingOff' ? 'neutral' : 'warning'
    sending.done = false
    sending.issue = issue
    sending.action =
      issue === 'credentials'
        ? 'reconnect'
        : ['payment', 'restricted', 'quality'].includes(issue)
          ? 'whatsapp_manager'
          : issue === 'unavailable'
            ? 'support'
            : undefined
  }
  if (reconnect) {
    sending.status = 'attention'
    sending.done = false
    if (sending.issue === 'credentials') {
      delete sending.issue
      delete sending.action
    }
  }
  if (setupBlocked && !issue && !reconnect) {
    sending.status = 'attention'
    sending.tone = 'warning'
    sending.done = false
  }
  return { rows: [number, templates, sending] }
}
