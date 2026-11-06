'use client'

import { api, getApiBaseUrl } from '@/shared/lib/auth'
import { ApiError, createApiError, parseJsonResponse } from '@/shared/lib/http'
import type { SupportedLocale } from '@/shared/lib/locale'
import type { SignupSessionHints } from '../model/signupMessage'
import { NETWORK_ERROR_CODE } from '../model/signupErrors'
import type { SignupCompletion } from '../model/signupMachine'

/** One accepted send, as it happened: history, never current readiness. */
export interface AcceptedSend {
  kind: 'akeed_system' | 'merchant_own'
  reason: string | null
  acceptedAt: string
  deliveryStatus: 'accepted' | 'delivered' | 'read' | 'failed'
}

export type SenderAlert = NonNullable<
  WhatsappSenderAvailability['alerts']
>[number]

/** Whether this organization may connect its own number, and who may. */
export interface WhatsappSenderAvailability {
  sendingEnabled?: boolean
  permissions?: { canDisconnect: boolean; canUpdateThankYou: boolean }
  /** The later of the two below. */
  lastAcceptedSend?: AcceptedSend | null
  /** Absent from an older backend. */
  lastAccepted?: {
    confirmation: AcceptedSend | null
    reminder: AcceptedSend | null
  }
  alerts?: {
    kind:
      | 'fallback'
      | 'disconnect'
      | 'template_rejection'
      | 'quality_drop'
      | 'payment'
    reason: string
    severity: 'warning' | 'critical'
    action: 'reconnect' | 'whatsapp_manager' | 'review_templates' | 'none'
    templates: {
      key: string
      language: string
      status: string
      category: string | null
    }[]
  }[]
  available: boolean
  appId: string | null
  configId: string | null
  canConnect: boolean
}

export interface ConnectTicketIssued {
  /** Carries a one-time ticket: used for navigation only, never stored. */
  connectUrl: string
  expiresAt: string
}

export interface WhatsappConnectionStatus {
  thankYouEnabled: boolean
  state: 'connecting' | 'verifying' | 'active' | 'disconnected' | 'offboarded'
  signupPath: 'coexistence' | 'new_number'
  displayPhoneNumber: string | null
  health: {
    stateReason: string | null
    qualityRating: string | null
    degradedClass: string | null
    lastCheckedAt: string | null
  }
  setup: {
    status: string
    step: string
    errorCode: string | null
    retryAt: string | null
    subscribedAt: string | null
    numberVerifiedAt: string | null
    registeredAt: string | null
    completedAt: string | null
  }
  templates: {
    total: number
    ready: number
    pending: number
    rejected: number
    recategorized: number
    retrying: number
    needsStaff: number
    drift: number
  }
  templateDetails: {
    key: string
    language: string
    languageCode: string
    status: string
    category: string | null
    readiness: { kind: 'akeed_system' | 'merchant_own'; reason: string }
  }[]
}

export function getWhatsappConnection() {
  return api.get<{ connection: WhatsappConnectionStatus | null }>(
    '/api/whatsapp-sender/connection'
  )
}

export function updateWhatsappThankYou(thankYouEnabled: boolean) {
  return api.patch<{ thankYouEnabled: boolean }>(
    '/api/whatsapp-sender/connection',
    { thankYouEnabled }
  )
}

export interface WhatsappDisconnectResult {
  state: 'disconnected'
  providerCleanup: 'succeeded' | 'manual_required' | 'not_needed'
  /** Steps left in the WhatsApp Business app; empty for a new number. */
  businessAppSteps: string[]
}

export function disconnectWhatsapp() {
  return api.post<WhatsappDisconnectResult>(
    '/api/whatsapp-sender/disconnect',
    {}
  )
}

export interface ConnectTicketClaimed {
  /** Single use; kept in memory for the one completion request. */
  signupTicket: string
  expiresAt: string
  appId: string
  configId: string
  graphApiVersion: string
}

export const whatsappSenderQueryKey = ['whatsapp-sender'] as const
export const whatsappConnectionQueryKey = [
  'whatsapp-sender',
  'connection',
] as const

export function getWhatsappSender(): Promise<WhatsappSenderAvailability> {
  return api.get<WhatsappSenderAvailability>('/api/whatsapp-sender')
}

export function issueConnectTicket(
  locale: SupportedLocale
): Promise<ConnectTicketIssued> {
  return api.post<ConnectTicketIssued>('/api/whatsapp-sender/connect-ticket', {
    locale,
  })
}

/** Long enough for Meta's checks behind the completion, and no longer. */
const TICKET_REQUEST_TIMEOUT_MS = 45_000

/**
 * The connect page runs without an Akeed or Shopify session: its requests are
 * authenticated by the ticket in the body. They skip `api.*`, whose 401
 * handling would send the merchant to the login page, and carry no cookies.
 */
async function postWithTicket<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(TICKET_REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new ApiError('Network request failed', 0, NETWORK_ERROR_CODE)
  }
  if (!response.ok) throw await createApiError(response)
  return parseJsonResponse<T>(response)
}

export function claimConnectTicket(
  ticket: string
): Promise<ConnectTicketClaimed> {
  return postWithTicket('/api/whatsapp-connect/claim', { ticket })
}

export function completeWhatsappSignup(input: {
  signupTicket: string
  code: string
  session: SignupSessionHints | null
}): Promise<SignupCompletion & { state: 'connecting' }> {
  const session = input.session
  return postWithTicket('/api/whatsapp-connect/complete', {
    signupTicket: input.signupTicket,
    code: input.code,
    ...(session && session.wabaIds.length > 0
      ? { wabaIds: session.wabaIds }
      : {}),
    ...(session?.phoneNumberId ? { phoneNumberId: session.phoneNumberId } : {}),
    ...(session && session.isOnBusinessApp !== null
      ? { isOnBusinessApp: session.isOnBusinessApp }
      : {}),
  })
}

export function apiErrorCode(error: unknown): string {
  if (error instanceof ApiError) return error.code ?? 'UNKNOWN'
  return NETWORK_ERROR_CODE
}
