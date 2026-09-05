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
  paymentMethod: 'cash_on_delivery'
}

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
