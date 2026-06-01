export const AKEED_WHATSAPP_PHONE_NUMBER = '201148675077'

export function createAkeedWhatsAppUrl(message: string): string {
  return `https://wa.me/${AKEED_WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`
}

interface EmbeddedSupportWhatsAppUrlParams {
  defaultMessage: string
  shopLabel: string
  pageLabel: string
  localeLabel: string
  issuePrompt: string
  shopDomain: string | null
  pathname: string
  locale: string
}

export function createAkeedEmbeddedSupportWhatsAppUrl({
  defaultMessage,
  shopLabel,
  pageLabel,
  localeLabel,
  issuePrompt,
  shopDomain,
  pathname,
  locale,
}: EmbeddedSupportWhatsAppUrlParams): string {
  const lines = [
    defaultMessage,
    shopDomain ? `${shopLabel}: ${shopDomain}` : null,
    `${pageLabel}: ${pathname || '/'}`,
    `${localeLabel}: ${locale}`,
    '',
    `${issuePrompt}:`,
  ].filter((line): line is string => line !== null)

  return createAkeedWhatsAppUrl(lines.join('\n'))
}
