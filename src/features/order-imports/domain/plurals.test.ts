import { describe, expect, it } from 'vitest'
import { createTranslator } from 'next-intl'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'

const arabicForms = ['zero', 'one', 'two', 'few', 'many', 'other'] as const
const counts = [0, 1, 2, 3, 11, 100]

/** Every message under `node`, keyed by its dotted path. */
function messagesOf(node: unknown, prefix: string): Array<[string, string]> {
  if (typeof node === 'string') return [[prefix, node]]
  if (!node || typeof node !== 'object') return []
  return Object.entries(node).flatMap(([key, value]) =>
    messagesOf(value, prefix ? `${prefix}.${key}` : key)
  )
}

/** The branch selectors of each `{x, plural, ...}` in a message. */
function pluralSelectors(message: string): string[][] {
  const blocks: string[][] = []
  let from = 0
  for (;;) {
    const start = message.indexOf(', plural,', from)
    if (start === -1) return blocks
    const selectors: string[] = []
    let depth = 0
    let token = ''
    for (let i = start + ', plural,'.length; i < message.length; i++) {
      const char = message[i]
      if (char === '{') {
        if (depth === 0) selectors.push(token.trim())
        depth++
        token = ''
      } else if (char === '}') {
        if (depth === 0) {
          from = i
          break
        }
        depth--
      } else if (depth === 0) token += char
    }
    blocks.push(selectors)
    if (from <= start) return blocks
  }
}

const arabicPlurals = messagesOf(ar.orderImport, 'orderImport').filter(
  ([, message]) => message.includes(', plural,')
)

describe('Arabic plurals in order imports', () => {
  it('has count messages to check', () => {
    expect(arabicPlurals.length).toBeGreaterThan(5)
  })

  it.each(arabicPlurals)('%s covers all six Arabic forms', (_key, message) => {
    for (const selectors of pluralSelectors(message))
      for (const form of arabicForms)
        // `=0` is an exact match that stands in for the zero category.
        expect(selectors.map((s) => (s === '=0' ? 'zero' : s))).toContain(form)
  })

  it.each(arabicPlurals)(
    '%s formats for 0, 1, 2, 3, 11 and 100',
    (key, message) => {
      const t = createTranslator({ locale: 'ar', messages: ar })
      // Every placeholder gets the count; plain ones just print it.
      const names = [...message.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1])
      for (const count of counts) {
        const values = Object.fromEntries(names.map((name) => [name, count]))
        const text = t(key as never, values as never) as string
        expect(text).not.toMatch(/\{|\}/)
      }
    }
  )

  it('picks the right noun form for each count', () => {
    const t = createTranslator({ locale: 'ar', messages: ar })
    const failed = (count: number) =>
      t('orderImport.release.failedSome', { count })
    expect(failed(1)).toContain('عميل واحد')
    expect(failed(2)).toContain('عميلين')
    expect(failed(3)).toContain('3 عملاء')
    expect(failed(11)).toContain('11 عميلًا')
    expect(failed(100)).toContain('100 عميل')
  })

  it('has an English message for every Arabic count message', () => {
    const t = createTranslator({ locale: 'en', messages: en })
    for (const [key] of arabicPlurals)
      expect(t.has(key as never), key).toBe(true)
  })
})
