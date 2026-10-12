import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LOCALES } from '@/shared/lib/locale'

const DOCS_ROOT = path.join(process.cwd(), 'content', 'docs')

function guides(locale: string) {
  const directory = path.join(DOCS_ROOT, locale)
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => {
      const { data } = matter(
        readFileSync(path.join(directory, fileName), 'utf8')
      )
      return {
        fileName,
        slug: String(data.slug),
        order: Number(data.order),
        title: String(data.title ?? ''),
      }
    })
}

describe('help guides', () => {
  const english = guides('en')

  it.each(SUPPORTED_LOCALES)(
    'has every guide in %s, in the same place',
    (locale) => {
      const localized = guides(locale)

      expect(
        localized.map(({ fileName, slug, order }) => [fileName, slug, order])
      ).toEqual(
        english.map(({ fileName, slug, order }) => [fileName, slug, order])
      )
      expect(localized.every((guide) => guide.title.length > 0)).toBe(true)
    }
  )
})
