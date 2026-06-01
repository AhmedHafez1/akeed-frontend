import type { Locale } from '@/i18n'

export interface DocFrontmatter {
  title: string
  description?: string
  order?: number
  slug?: string
}

export interface ParsedDoc {
  locale: Locale
  slug: string
  title: string
  description?: string
  order: number
  content: string
  filePath: string
}

export interface DocListItem {
  locale: Locale
  slug: string
  title: string
  description?: string
  order: number
}

export interface DocNavItem {
  slug: string
  title: string
  description?: string
  href: string
  order: number
}

export interface DocPagerItem {
  slug: string
  title: string
  href: string
}
