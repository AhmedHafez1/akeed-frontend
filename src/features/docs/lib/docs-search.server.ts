import 'server-only'

import { locales } from '@/i18n'
import type { Locale } from '@/i18n'
import { getAllDocs } from '@/features/docs/lib/docs'
import type { DocSearchEntry } from '@/features/docs/model/docs-search.model'

const MAX_EXCERPT_LENGTH = 180
const MAX_CONTENT_LENGTH = 4000

function stripMarkdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeExcerpt(text: string): string {
  if (text.length <= MAX_EXCERPT_LENGTH) {
    return text
  }

  return `${text.slice(0, MAX_EXCERPT_LENGTH).trim()}...`
}

function clampContentText(text: string): string {
  if (text.length <= MAX_CONTENT_LENGTH) {
    return text
  }

  return text.slice(0, MAX_CONTENT_LENGTH)
}

export async function buildDocsSearchIndex(
  locale: Locale
): Promise<DocSearchEntry[]> {
  const docs = await getAllDocs(locale)

  return docs.map((doc) => {
    const plainText = stripMarkdownToText(doc.content)
    const normalizedText = clampContentText(plainText)

    return {
      id: `${locale}:${doc.slug}`,
      locale,
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      excerpt: makeExcerpt(doc.description ?? normalizedText),
      contentText: normalizedText,
      href: `/${locale}/docs/${doc.slug}`,
    }
  })
}

export async function buildMultiLocaleDocsSearchIndex(): Promise<DocSearchEntry[]> {
  const entriesByLocale = await Promise.all(
    locales.map((locale) => buildDocsSearchIndex(locale))
  )

  return entriesByLocale.flat()
}
