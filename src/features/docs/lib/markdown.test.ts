import { describe, expect, it } from 'vitest'
import { slugifyHeading } from './markdown'

describe('slugifyHeading', () => {
  it.each([
    ['Path A: Shopify', 'path-a-shopify'],
    ['Cómo funcionan los créditos', 'cómo-funcionan-los-créditos'],
    ['¿Se necesita un número propio?', 'se-necesita-un-número-propio'],
    ['نظرة عامة', 'نظرة-عامة'],
    ['Çalışma şekli ve ödeme', 'çalışma-şekli-ve-ödeme'],
    ['İlk adımlar: Ğ ile ü', 'ilk-adımlar-ğ-ile-ü'],
  ])('turns "%s" into the id "%s"', (heading, id) => {
    expect(slugifyHeading(heading)).toBe(id)
  })
})
