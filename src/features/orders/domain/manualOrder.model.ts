import type { ManualOrderCreateResponse } from '../api/manualOrderApi'

export const manualOrderCurrencies = [
  'USD',
  'EUR',
  'EGP',
  'SAR',
  'AED',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'JOD',
  'MAD',
] as const

export type ManualOrderCurrency = (typeof manualOrderCurrencies)[number]

export interface ManualOrderFormValues {
  customerPhone: string
  customerName: string
  orderNumber: string
  totalPrice: string
  currency: string
}

/**
 * Every manually verified order is cash on delivery by definition — that is
 * the only thing Akeed verifies — so the merchant is not asked. The backend
 * still requires the field, so it is sent as a constant rather than collected.
 */
export const MANUAL_ORDER_PAYMENT_METHOD = 'cash_on_delivery' as const

export type ManualOrderRecoveryMode = 'retry' | 'conflict' | null

export interface ManualOrderFeedback {
  tone: 'critical' | 'warning'
  message: string
}

export type ManualOrderResult = ManualOrderCreateResponse

export function isManualOrderCurrency(
  value: string | null | undefined
): value is ManualOrderCurrency {
  return manualOrderCurrencies.includes(value as ManualOrderCurrency)
}
