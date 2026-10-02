import { readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Locale } from '@/i18n'
import { MarkdownContent } from './MarkdownContent'

function renderGuide(locale: Locale) {
  const { content } = matter(
    readFileSync(
      path.join(process.cwd(), 'content', 'docs', locale, 'server-api.md'),
      'utf8'
    )
  )
  const view = render(
    <MarkdownContent
      content={content.trim()}
      locale={locale}
      currentSlug="server-api"
    />
  )
  return { content, ...view }
}

describe('the Server API guide, rendered', () => {
  it('renders every code block of the English guide, left to right', () => {
    const { content, container } = renderGuide('en')
    const fences = content.match(/^```\w+\r?$/gm) ?? []
    const blocks = [...container.querySelectorAll('pre')]

    expect(fences.length).toBeGreaterThan(20)
    expect(blocks).toHaveLength(fences.length)
    for (const block of blocks) expect(block.getAttribute('dir')).toBe('ltr')
    // No fence, table pipe or heading mark is left as raw text.
    expect(container.textContent).not.toContain('```')
    expect(container.textContent).not.toContain('| --- |')
    expect(container.textContent).not.toMatch(/^#{2,3} /m)
    // The two callouts that open the guide stay two, each in its own tone.
    expect(container.textContent).not.toContain('[!')
    expect(container.querySelector('div.border-info-border')).not.toBeNull()
    expect(
      container.querySelectorAll('div.border-warning-border')
    ).toHaveLength(2)
  })

  it('prints the placeholders and the request an integrator copies', () => {
    const { container } = renderGuide('en')
    const text = container.textContent ?? ''

    for (const expected of [
      'curl -i -X POST "$AKEED_API_URL/api/v1/orders"',
      'Authorization: Bearer $AKEED_API_KEY',
      '<ORDER_ID>',
      '<CORRELATION_ID>',
      'Retry-After: <SECONDS>',
      'API_ORDER_EXTERNAL_ID_CONFLICT',
    ])
      expect(text).toContain(expected)
  })

  it.each(['en', 'ar'] as const)(
    'points every in-page link of the %s page at a heading that exists',
    (locale) => {
      const { container } = renderGuide(locale)
      const ids = new Set(
        [...container.querySelectorAll('h2[id], h3[id]')].map(({ id }) => id)
      )
      const targets = [...container.querySelectorAll('p a, td a, li a')]
        .map((link) => link.getAttribute('href') ?? '')
        .filter((href) => href.startsWith('#'))

      for (const target of targets) expect(ids).toContain(target.slice(1))
    }
  )

  it('keeps the Arabic overview free of code blocks and links it to the English guide', () => {
    const { container } = renderGuide('ar')
    const links = [...container.querySelectorAll('a')].map((link) =>
      link.getAttribute('href')
    )

    expect(container.querySelector('pre')).toBeNull()
    expect(links).toContain('/en/docs/server-api')
    expect(links).toContain('/ar/docs/bulk-order-import')
  })
})
