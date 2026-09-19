import type { ManualOrderCreateResponse } from '../api/manualOrderApi'

export {
  orderCurrencies as manualOrderCurrencies,
  DEFAULT_ORDER_CURRENCY as DEFAULT_MANUAL_ORDER_CURRENCY,
  isOrderCurrency as isManualOrderCurrency,
} from '@/shared/commerce/orderCommerce'
export type { OrderCurrency as ManualOrderCurrency } from '@/shared/commerce/orderCommerce'

export interface ManualOrderFormValues {
  customerPhone: string
  customerName: string
  orderNumber: string
  totalPrice: string
  currency: string
}

export type ManualOrderRecoveryMode = 'retry' | 'conflict' | null

export interface ManualOrderFeedback {
  tone: 'critical' | 'warning'
  message: string
  billingLink?: boolean
}

export type ManualOrderResult = ManualOrderCreateResponse
