import { readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { getLocalizedMarkdownHref } from './markdown'

function readGuide(locale: 'ar' | 'en') {
  return matter(
    readFileSync(
      path.join(process.cwd(), 'content', 'docs', locale, 'server-api.md'),
      'utf8'
    )
  )
}

/** Every `](target)` of a markdown document. */
function linkTargets(content: string): string[] {
  return [...content.matchAll(/\]\(([^)\s]+)\)/g)].map(([, target]) => target)
}

describe('the Server API guide', () => {
  const english = readGuide('en')
  const arabic = readGuide('ar')

  it('is one page in both locales, next to Bulk Order Import', () => {
    for (const guide of [english, arabic]) {
      expect(guide.data.slug).toBe('server-api')
      expect(guide.data.order).toBe(3)
      expect(String(guide.data.title).trim()).not.toBe('')
      expect(String(guide.data.description).trim()).not.toBe('')
    }
  })

  it('sends an Arabic reader to the English guide, not back to the overview', () => {
    const toEnglishGuide = linkTargets(arabic.content).filter(
      (target) => target === '/en/docs/server-api'
    )

    expect(toEnglishGuide.length).toBeGreaterThan(0)
    expect(getLocalizedMarkdownHref('/en/docs/server-api', 'ar')).toBe(
      '/en/docs/server-api'
    )
  })

  it('links only to pages that exist', () => {
    const pages = [
      '/docs/standalone-platform',
      '/docs/bulk-order-import',
      '/docs/order-confirmation',
      '/docs/automation-rules',
      '/docs/troubleshooting',
      '/en/docs/server-api',
      '/support',
    ]
    for (const guide of [english, arabic])
      for (const target of linkTargets(guide.content))
        if (!target.startsWith('#')) expect(pages).toContain(target)
  })

  it('keeps the sections its in-page links point to', () => {
    const headings = english.content
      .split(/\r?\n/)
      .filter((line) => /^#{2,3} /.test(line))
      .map((line) => line.replace(/^#+ /, ''))

    expect(headings).toEqual(
      expect.arrayContaining([
        'Quick Start',
        'Order Fields',
        'Sending an Order Twice',
        'Limits',
        'Examples',
        'Error Codes',
        'Getting Help',
      ])
    )
    // Raw HTML would be printed as text by the docs renderer.
    expect(english.content).not.toMatch(/<!--/)
  })

  it('promises no status or callback endpoint', () => {
    const paths = [...english.content.matchAll(/\/api\/v1\/[a-z/-]+/g)].map(
      ([found]) => found
    )

    expect(new Set(paths)).toEqual(new Set(['/api/v1/orders']))
    expect(english.content).not.toMatch(/\bGET \//)
  })
})
