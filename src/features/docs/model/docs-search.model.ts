import type { Locale } from '@/i18n'

export interface DocSearchEntry {
  id: string
  locale: Locale
  slug: string
  title: string
  description?: string
  excerpt: string
  contentText: string
  href: string
}

export interface DocSearchResult {
  item: DocSearchEntry
  score: number
}
