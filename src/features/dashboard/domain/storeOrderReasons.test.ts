import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { orderSourceLabelKey } from '@/features/dashboard/lib/orderDisplay'
import { resolveRowDescriptionKey } from './verificationRow'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'

const row = (reason: string) =>
  ({ status: 'failed', reason }) as VerificationItem

/**
 * Every reason a connected store's order can be recorded with when it is not
 * taken in (backend: the WooCommerce ingestion policy and normalizer, and the
 * queue's own source checks). The map is by code, never by platform.
 */
const STORE_ORDER_REASONS = [
  'order_predates_connection',
  'order_not_placed',
  'non_cod_payment_method',
  'missing_payment_signal',
  'missing_currency',
  'missing_phone_country',
  'invalid_phone',
  'invalid_amount',
  'incomplete_payload',
  'integration_inactive',
  'onboarding_incomplete',
] as const

const messages = { ar, en }

describe('reasons a store order was not confirmed', () => {
  it.each(STORE_ORDER_REASONS)(
    'explains %s in Arabic and English',
    (reason) => {
      expect(resolveRowDescriptionKey(row(reason))).toBe(`reasons.${reason}`)
      for (const locale of ['ar', 'en'] as const) {
        const sentence = (
          messages[locale].dashboard.reasons as Record<string, string>
        )[reason]

        expect(sentence, `${locale}:${reason}`).toBeTruthy()
        // A sentence for the merchant, not the code itself.
        expect(sentence).not.toContain(reason)
      }
    }
  )

  it('says why an older or unplaced order was left alone, in each language', () => {
    expect(en.dashboard.reasons.order_predates_connection).toBe(
      'This order was placed before the store was connected to Akeed, so no confirmation was sent.'
    )
    expect(en.dashboard.reasons.order_not_placed).toBe(
      'This order has not been placed yet, or its status is one Akeed does not confirm, so no message was sent.'
    )
    expect(ar.dashboard.reasons.order_predates_connection).not.toBe(
      en.dashboard.reasons.order_predates_connection
    )
    expect(ar.dashboard.reasons.order_not_placed).not.toBe(
      en.dashboard.reasons.order_not_placed
    )
  })
})

describe('the WooCommerce order source', () => {
  it('is named through the shared source label map', () => {
    expect(orderSourceLabelKey('woocommerce')).toBe('sources.woocommerce')
    expect(en.dashboard.sources.woocommerce).toBe('WooCommerce')
    expect(ar.dashboard.sources.woocommerce).toBeTruthy()
  })
})
