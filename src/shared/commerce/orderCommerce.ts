/**
 * Order values every Standalone order path shares: the manual order form and
 * the file import. The currency list mirrors the backend's
 * ONBOARDING_SHIPPING_CURRENCIES; keep this the only frontend copy.
 */
export const orderCurrencies = [
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

export type OrderCurrency = (typeof orderCurrencies)[number]

export const DEFAULT_ORDER_CURRENCY: OrderCurrency = 'EGP'

export function isOrderCurrency(
  value: string | null | undefined
): value is OrderCurrency {
  return orderCurrencies.includes(value as OrderCurrency)
}

/**
 * The canonical payment method of a cash-on-delivery order, the only kind
 * Akeed verifies. The manual form sends it as a constant rather than asking
 * the merchant, because the backend still requires the field.
 */
export const COD_PAYMENT_METHOD = 'cash_on_delivery' as const
