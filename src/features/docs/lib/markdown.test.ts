import { describe, expect, it } from 'vitest'
import { slugifyHeading } from './markdown'

describe('slugifyHeading', () => {
  it.each([
    ['Path A: Shopify', 'path-a-shopify'],
    ['Cómo funcionan los créditos', 'cómo-funcionan-los-créditos'],
    ['¿Se necesita un número propio?', 'se-necesita-un-número-propio'],
    ['نظرة عامة', 'نظرة-عامة'],
  ])('turns "%s" into the id "%s"', (heading, id) => {
    expect(slugifyHeading(heading)).toBe(id)
  })
})
