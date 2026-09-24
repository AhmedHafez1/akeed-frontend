/**
 * WhatsApp delivery error codes the merchant can act on, mapped to the key of
 * a sentence under `dashboard.deliveryFailure`. Any other code reads as the
 * generic "the message was not delivered".
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
 */
const DELIVERY_FAILURE_KEYS: Record<string, string> = {
  '131026': 'notOnWhatsApp',
  '131021': 'invalidNumber',
  '131009': 'invalidNumber',
  '100': 'invalidNumber',
  '131047': 'reengagement',
  '131049': 'notDelivered',
}

export function deliveryFailureKey(code: string | null | undefined): string {
  return (code && DELIVERY_FAILURE_KEYS[code]) || 'generic'
}
