export const AKEED_WHATSAPP_PHONE_NUMBER = '201148675077'

export function createAkeedWhatsAppUrl(message: string): string {
  return `https://wa.me/${AKEED_WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`
}
