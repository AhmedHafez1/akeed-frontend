import type {
  AcceptedSend,
  SenderAlert,
  WhatsappConnectionStatus,
  WhatsappSenderAvailability,
} from '../api/whatsappConnectApi'

/**
 * What the WhatsApp settings tab shows, from the two server answers alone.
 * Both skins render this; neither decides a state of its own.
 *
 * Three facts stay apart on purpose: whether the number is ready now, which
 * sender each template would use now, and which sender the last accepted
 * message actually went from. An earlier send from the merchant's number, or
 * an approved template on a degraded number, never makes the number "ready".
 */

export type NumberReadiness =
  | 'ready'
  | 'templatesVary'
  | 'noTemplatesReady'
  | 'preparing'
  | 'degradedPayment'
  | 'degradedCredentials'
  | 'degradedRestricted'
  | 'degradedOther'
  | 'sendingOff'
  | 'disconnected'
  | 'offboarded'

export type ConnectionBadge = 'connected' | 'preparing' | 'disconnected'

export type TemplateStatus =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'paused'
  | 'recategorized'
  | 'missing'

export type TemplateMessage =
  | 'confirmation'
  | 'reminder'
  | 'thankYouConfirmed'
  | 'thankYouCanceled'
  | 'other'

/** Why a template would go from Akeed now; null when it uses your number. */
export type SenderReason =
  | 'featureOff'
  | 'notReady'
  | 'disconnected'
  | 'degraded'
  | 'templateMissing'
  | 'templateRejected'
  | 'templatePaused'
  | 'templatePending'
  | 'templateRecategorized'
  | 'other'

export interface TemplateRow {
  key: string
  /** The WhatsApp message language, not the interface language. */
  languageCode: string
  language: string
  message: TemplateMessage
  status: TemplateStatus
  sender: 'yourNumber' | 'akeed'
  reason: SenderReason | null
}

export type BannerKey =
  | 'sendingOff'
  | 'templatesInReview'
  | 'disconnect.disconnected'
  | 'disconnect.offboarded'
  | 'disconnect.primary_inactivity'
  | 'payment.payment'
  | 'quality_drop.red'
  | 'template_rejection.recategorized'
  | 'template_rejection.unavailable'
  | 'fallback.credentials'
  | 'fallback.restricted'
  | 'fallback.sender_unavailable'

export interface TabBanner {
  key: BannerKey
  tone: 'warning' | 'critical' | 'info'
  /** What the merchant can do about it. */
  action: 'reconnect' | 'whatsapp_manager' | 'review_templates' | 'none'
  /**
   * The number comes back on its own once the cause is fixed. Never claimed
   * while sending from merchant numbers is switched off.
   */
  resumes: boolean
  templates: { language: string; message: TemplateMessage }[]
}

export interface ConnectionView {
  kind: 'connection'
  state: WhatsappConnectionStatus['state']
  phone: string | null
  signupPath: WhatsappConnectionStatus['signupPath']
  badge: ConnectionBadge
  readiness: NumberReadiness
  templates: TemplateRow[]
  readyCount: number
  lastConfirmation: AcceptedSend | null
  lastReminder: AcceptedSend | null
  banners: TabBanner[]
  thankYou: { enabled: boolean; canUpdate: boolean }
  canDisconnect: boolean
  /** Only a disconnected connection can start a new signup. */
  canReconnect: boolean
  /** Disconnect first, then reconnect: offboarded, or a reconnect alert on a live connection. */
  reconnectNeedsDisconnect: boolean
  isOwner: boolean
}

export type WhatsappTabView =
  /** Neither connecting nor a connection: the tab is hidden. */
  | { kind: 'hidden' }
  | { kind: 'unconnected'; canConnect: boolean }
  | ConnectionView

const DEGRADED: Record<string, NumberReadiness> = {
  payment: 'degradedPayment',
  credentials: 'degradedCredentials',
  restricted: 'degradedRestricted',
}

const SENDER_REASONS: Record<string, SenderReason> = {
  feature_off: 'featureOff',
  no_connection: 'notReady',
  not_ready: 'notReady',
  disconnected: 'disconnected',
  offboarded: 'disconnected',
  template_missing: 'templateMissing',
  template_rejected: 'templateRejected',
  template_paused: 'templatePaused',
  template_pending: 'templatePending',
  template_recategorized: 'templateRecategorized',
}

export function templateMessage(key: string): TemplateMessage {
  const family = key.split('.')[0]
  if (family.startsWith('cod_confirm')) return 'confirmation'
  if (family.startsWith('cod_reminder')) return 'reminder'
  if (family === 'ack_confirmed') return 'thankYouConfirmed'
  if (family === 'ack_canceled') return 'thankYouCanceled'
  return 'other'
}

export function templateStatus(
  status: string,
  category: string | null
): TemplateStatus {
  if (status === 'missing') return 'missing'
  if (status === 'rejected') return 'rejected'
  if (status === 'paused' || status === 'disabled') return 'paused'
  if (status !== 'approved') return 'pending'
  return category && category !== 'utility' ? 'recategorized' : 'approved'
}

export function senderReason(reason: string): SenderReason | null {
  if (reason === 'own_number') return null
  if (reason.startsWith('degraded:')) return 'degraded'
  return SENDER_REASONS[reason] ?? 'other'
}

const MESSAGE_ORDER: Record<TemplateMessage, number> = {
  confirmation: 0,
  reminder: 1,
  thankYouConfirmed: 2,
  thankYouCanceled: 3,
  other: 4,
}

function templateRows(connection: WhatsappConnectionStatus): TemplateRow[] {
  return connection.templateDetails
    .map((detail) => ({
      key: detail.key,
      languageCode: detail.languageCode,
      language: detail.language,
      message: templateMessage(detail.key),
      status: templateStatus(detail.status, detail.category),
      sender:
        detail.readiness.kind === 'merchant_own'
          ? ('yourNumber' as const)
          : ('akeed' as const),
      reason:
        detail.readiness.kind === 'merchant_own'
          ? null
          : senderReason(detail.readiness.reason),
    }))
    .sort(
      (a, b) =>
        MESSAGE_ORDER[a.message] - MESSAGE_ORDER[b.message] ||
        a.language.localeCompare(b.language) ||
        a.key.localeCompare(b.key)
    )
}

function readinessOf(
  connection: WhatsappConnectionStatus,
  sendingEnabled: boolean,
  rows: TemplateRow[]
): NumberReadiness {
  if (connection.state === 'disconnected') return 'disconnected'
  if (connection.state === 'offboarded') return 'offboarded'
  if (!sendingEnabled) return 'sendingOff'
  if (connection.state !== 'active') return 'preparing'
  if (connection.health.degradedClass)
    return DEGRADED[connection.health.degradedClass] ?? 'degradedOther'
  const own = rows.filter((row) => row.sender === 'yourNumber').length
  if (own === 0) return 'noTemplatesReady'
  return own === rows.length ? 'ready' : 'templatesVary'
}

function bannerOf(alert: SenderAlert, sendingEnabled: boolean): TabBanner {
  const key = `${alert.kind}.${alert.reason}` as BannerKey
  return {
    key,
    tone: alert.severity === 'critical' ? 'critical' : 'warning',
    action: alert.action,
    resumes:
      sendingEnabled &&
      (alert.kind === 'payment' ||
        alert.kind === 'quality_drop' ||
        (alert.kind === 'fallback' && alert.reason === 'restricted')),
    templates: alert.templates.map((template) => ({
      language: template.language,
      message: templateMessage(template.key),
    })),
  }
}

const KNOWN_BANNERS: ReadonlySet<string> = new Set<BannerKey>([
  'disconnect.disconnected',
  'disconnect.offboarded',
  'disconnect.primary_inactivity',
  'payment.payment',
  'quality_drop.red',
  'template_rejection.recategorized',
  'template_rejection.unavailable',
  'fallback.credentials',
  'fallback.restricted',
  'fallback.sender_unavailable',
])

export function whatsappTabView(
  availability: WhatsappSenderAvailability | undefined,
  connection: WhatsappConnectionStatus | null
): WhatsappTabView {
  const available = Boolean(availability?.available)
  if (!connection) {
    return available
      ? { kind: 'unconnected', canConnect: Boolean(availability?.canConnect) }
      : { kind: 'hidden' }
  }
  const sendingEnabled = availability?.sendingEnabled === true
  const rows = templateRows(connection)
  const readiness = readinessOf(connection, sendingEnabled, rows)
  const permissions = availability?.permissions
  const isOwner = permissions?.canDisconnect === true
  const live = connection.state !== 'disconnected'

  const banners: TabBanner[] = []
  if (!sendingEnabled && live && connection.state !== 'offboarded') {
    banners.push({
      key: 'sendingOff',
      tone: 'info',
      action: 'none',
      resumes: false,
      templates: [],
    })
  }
  for (const alert of availability?.alerts ?? []) {
    if (KNOWN_BANNERS.has(`${alert.kind}.${alert.reason}`))
      banners.push(bannerOf(alert, sendingEnabled))
  }
  const pending = rows.filter((row) => row.status === 'pending').length
  if (
    sendingEnabled &&
    connection.state === 'active' &&
    !connection.health.degradedClass &&
    pending > 0 &&
    !banners.some((banner) => banner.key.startsWith('template_rejection'))
  ) {
    banners.push({
      key: 'templatesInReview',
      tone: 'warning',
      action: 'none',
      resumes: false,
      templates: [],
    })
  }

  const wantsReconnect = banners.some((banner) => banner.action === 'reconnect')
  return {
    kind: 'connection',
    state: connection.state,
    phone: connection.displayPhoneNumber,
    signupPath: connection.signupPath,
    badge:
      connection.state === 'active'
        ? 'connected'
        : live && connection.state !== 'offboarded'
          ? 'preparing'
          : 'disconnected',
    readiness,
    templates: rows,
    readyCount: rows.filter((row) => row.sender === 'yourNumber').length,
    // The combined `lastAcceptedSend` may be a reminder, so it never stands
    // in for the confirmation.
    lastConfirmation: availability?.lastAccepted?.confirmation ?? null,
    lastReminder: availability?.lastAccepted?.reminder ?? null,
    banners,
    thankYou: {
      enabled: connection.thankYouEnabled,
      canUpdate: permissions?.canUpdateThankYou === true,
    },
    // Disconnecting twice is harmless, but offering it on a removed number
    // would read as if something were still linked.
    canDisconnect: isOwner && live,
    canReconnect:
      connection.state === 'disconnected' &&
      available &&
      availability?.canConnect === true,
    reconnectNeedsDisconnect:
      connection.state === 'offboarded' ||
      (connection.state !== 'disconnected' && wantsReconnect),
    isOwner,
  }
}
