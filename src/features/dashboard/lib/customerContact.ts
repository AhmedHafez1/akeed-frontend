import { whatsAppChatUrl } from './orderDisplay'

/**
 * Ways for the merchant to reach a customer outside Akeed: a WhatsApp chat,
 * a phone call, or the number to paste elsewhere. Built from the stored
 * number (E.164) with the same rule as every WhatsApp link in the dashboard,
 * so a number too short to dial gives no links at all. Opening one sends
 * nothing through Akeed.
 */
export interface CustomerContact {
  whatsAppUrl: string
  callUrl: string
  /** What "Copy number" puts on the clipboard: the number as stored. */
  copyText: string
}

export function customerContact(
  phone: string | null | undefined
): CustomerContact | null {
  const whatsAppUrl = whatsAppChatUrl(phone)
  if (!phone || !whatsAppUrl) return null
  const digits = phone.replace(/\D/g, '')
  return {
    whatsAppUrl,
    callUrl: `tel:+${digits}`,
    copyText: phone.trim().startsWith('+') ? `+${digits}` : digits,
  }
}
