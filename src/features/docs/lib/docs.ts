import 'server-only'

import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import matter from 'gray-matter'
import { z } from 'zod'
import { locales } from '@/i18n'
import type { Locale } from '@/i18n'
import type { DocListItem, ParsedDoc } from '@/features/docs/model/docs.model'

const DOCS_ROOT = path.join(process.cwd(), 'content', 'docs')
const DEFAULT_ORDER = 999

const frontmatterSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().trim().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
  slug: z.string().trim().min(1).optional(),
})

function assertLocale(locale: string): asserts locale is Locale {
  if (!locales.includes(locale as Locale)) {
    throw new Error(`Unsupported docs locale: ${locale}`)
  }
}

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getDocsDirectory(locale: Locale): string {
  return path.join(DOCS_ROOT, locale)
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.md')
}

function sortDocs<T extends { order: number; title: string }>(docs: T[]): T[] {
  return [...docs].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title)
  })
}

async function parseDocFile(
  locale: Locale,
  absoluteFilePath: string
): Promise<ParsedDoc> {
  const raw = await readFile(absoluteFilePath, 'utf8')
  const { data, content } = matter(raw)

  const parsed = frontmatterSchema.safeParse(data)
  if (!parsed.success) {
    const fileName = path.basename(absoluteFilePath)
    throw new Error(
      `Invalid frontmatter in ${locale}/${fileName}: ${parsed.error.message}`
    )
  }

  const fileNameWithoutExt = path.basename(absoluteFilePath, '.md')
  const slug = toSlug(parsed.data.slug ?? fileNameWithoutExt)

  return {
    locale,
    slug,
    title: parsed.data.title,
    description: parsed.data.description,
    order: parsed.data.order ?? DEFAULT_ORDER,
    content,
    filePath: absoluteFilePath,
  }
}

export async function getAllDocs(localeInput: string): Promise<ParsedDoc[]> {
  assertLocale(localeInput)
  const locale = localeInput
  const dir = getDocsDirectory(locale)

  const entries = await readdir(dir, { withFileTypes: true })
  const markdownEntries = entries.filter(
    (entry) => entry.isFile() && isMarkdownFile(entry.name)
  )

  const docs = await Promise.all(
    markdownEntries.map((entry) => parseDocFile(locale, path.join(dir, entry.name)))
  )

  return sortDocs(docs)
}

export async function getDocBySlug(
  localeInput: string,
  slugInput: string
): Promise<ParsedDoc | null> {
  const docs = await getAllDocs(localeInput)
  const normalizedSlug = toSlug(slugInput)
  return docs.find((doc) => doc.slug === normalizedSlug) ?? null
}

export async function getAllDocSlugs(localeInput: string): Promise<string[]> {
  const docs = await getAllDocs(localeInput)
  return docs.map((doc) => doc.slug)
}

export async function getDocList(localeInput: string): Promise<DocListItem[]> {
  const docs = await getAllDocs(localeInput)
  return docs.map((doc) => ({
    locale: doc.locale,
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    order: doc.order,
  }))
}

export function getDocsRootPath(): string {
  return DOCS_ROOT
}
