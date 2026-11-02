'use client'

import { api, getApiBaseUrl } from '@/shared/lib/auth'
import { ApiError, createApiError, parseJsonResponse } from '@/shared/lib/http'
import type { SupportedLocale } from '@/shared/lib/locale'
import type { SignupSessionHints } from '../model/signupMessage'
import { NETWORK_ERROR_CODE } from '../model/signupErrors'
import type { SignupCompletion } from '../model/signupMachine'

/** Whether this organization may connect its own number, and who may. */
export interface WhatsappSenderAvailability {
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

export interface ConnectTicketClaimed {
  /** Single use; kept in memory for the one completion request. */
  signupTicket: string
  expiresAt: string
  appId: string
  configId: string
  graphApiVersion: string
}

export const whatsappSenderQueryKey = ['whatsapp-sender'] as const

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
