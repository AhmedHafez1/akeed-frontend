import { withLocale } from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'

export const docsArticleSlugs = {
  gettingStarted: 'getting-started',
  orderConfirmation: 'order-confirmation',
  whatsappTemplates: 'whatsapp-templates',
  automationRules: 'automation-rules',
  analytics: 'analytics',
  troubleshooting: 'troubleshooting',
} as const

export type DocsArticleKey = keyof typeof docsArticleSlugs

export function buildDocsArticleHref(params: {
  locale: SupportedLocale
  article: DocsArticleKey
  hash?: string
}): string {
  const { locale, article, hash } = params
  const slug = docsArticleSlugs[article]
  const normalizedHash = hash ? `#${hash.replace(/^#/, '')}` : ''

  return withLocale(`/docs/${slug}${normalizedHash}`, locale)
}
