import { describe, expect, it } from 'vitest'
import type {
  OrderImportField,
  OrderImportFieldSuggestion,
  OrderImportMappingState,
  OrderImportSampleRow,
} from '../api/orderImportsApi'
import {
  attentionFields,
  countryChange,
  initialMappingForm,
  isAllMatched,
  sampleValues,
  suggestColumn,
  toSaveBody,
} from './mappingForm'

describe('countryChange', () => {
  it("brings the new country's currency along with the country", () => {
    expect(countryChange({ country: 'SA', currency: 'SAR' }, 'EG')).toEqual({
      country: 'EG',
      currency: 'EGP',
    })
  })

  it('replaces the USD placeholder default', () => {
    expect(countryChange({ country: 'EG', currency: 'USD' }, 'EG')).toEqual({
      country: 'EG',
      currency: 'EGP',
    })
  })

  it("keeps a currency the merchant chose over the country's", () => {
    expect(countryChange({ country: 'EG', currency: 'EUR' }, 'SA')).toEqual({
      country: 'SA',
    })
  })

  it('keeps the currency for a country without a known one', () => {
    expect(countryChange({ country: 'EG', currency: 'EGP' }, 'FR')).toEqual({
      country: 'FR',
    })
  })
})

function suggestion(
  field: OrderImportField,
  columns: string[],
  confidence: OrderImportFieldSuggestion['confidence'] = 'exact',
  alternatives: string[] = []
): OrderImportFieldSuggestion {
  return {
    field,
    required: ['phone', 'customerName', 'amount'].includes(field),
    columns,
    confidence,
    source: columns.length ? 'auto' : 'none',
    alternatives,
  }
}

function state(
  fields: OrderImportFieldSuggestion[],
  paymentValues: OrderImportMappingState['paymentValues'] = null
): OrderImportMappingState {
  return {
    suggestions: { fields, unmappedColumns: [] },
    options: {
      country: 'EG',
      defaultCurrency: 'EGP',
      dateFormat: 'auto',
      paymentValueMap: {},
    },
    paymentValues,
    dateFormat: null,
  }
}

const matched = [
  suggestion('phone', ['Phone']),
  suggestion('customerName', ['Name']),
  suggestion('amount', ['Amount']),
]
const noChecks = { paymentValues: null, dateFormat: null }
const bySuggestion = (list: OrderImportFieldSuggestion[]) =>
  new Map(list.map((entry) => [entry.field, entry]))

describe('isAllMatched', () => {
  it('opens collapsed when every required column is an exact match', () => {
    const form = initialMappingForm(state(matched))
    expect(isAllMatched(bySuggestion(matched), form, noChecks)).toBe(true)
  })

  it('asks for help when a required column is missing or a guess', () => {
    const list = [
      suggestion('phone', []),
      suggestion('customerName', ['First'], 'partial'),
      suggestion('amount', ['Amount']),
    ]
    const form = initialMappingForm(state(list))
    expect(attentionFields(bySuggestion(list), form, noChecks)).toEqual([
      'phone',
      'customerName',
    ])
    expect(isAllMatched(bySuggestion(list), form, noChecks)).toBe(false)
  })

  it('is not all matched when one column feeds two fields', () => {
    const list = [
      suggestion('phone', ['Phone']),
      suggestion('customerName', ['Phone']),
      suggestion('amount', ['Amount']),
    ]
    const form = initialMappingForm(state(list))
    expect(isAllMatched(bySuggestion(list), form, noChecks)).toBe(false)
  })
})

describe('sampleValues', () => {
  const rows = (values: string[]): OrderImportSampleRow[] =>
    values.map((value, index) => ({
      rowNumber: index + 2,
      raw: { Amount: value },
      issues: [],
    }))

  it('shows distinct examples, not "500, 500"', () => {
    expect(sampleValues(rows(['500', '500', ' ', '750']), ['Amount'])).toEqual([
      '500',
      '750',
    ])
  })
})

describe('suggestColumn', () => {
  const rows: OrderImportSampleRow[] = [
    {
      rowNumber: 2,
      raw: { Contact: '01012345670', City: 'Cairo' },
      issues: [],
    },
    { rowNumber: 3, raw: { Contact: '01098765432', City: 'Giza' }, issues: [] },
  ]

  it("offers the matcher's first unused alternative", () => {
    expect(
      suggestColumn(
        'phone',
        suggestion('phone', [], 'none', ['Mobile', 'Contact']),
        ['Mobile', 'Contact'],
        rows,
        new Set(['Mobile'])
      )
    ).toBe('Contact')
  })

  it('finds a column whose values look like phone numbers', () => {
    expect(
      suggestColumn(
        'phone',
        suggestion('phone', [], 'none'),
        ['City', 'Contact'],
        rows,
        new Set()
      )
    ).toBe('Contact')
  })

  it('offers nothing it cannot recognize', () => {
    expect(
      suggestColumn('notes', undefined, ['City'], rows, new Set())
    ).toBeNull()
  })
})

describe('unclassified payment values', () => {
  const payment = {
    column: 'Payment',
    values: [
      {
        value: 'InstaPay',
        normalizedValue: 'instapay',
        count: 1,
        classification: 'unknown' as const,
        autoClassification: 'unknown' as const,
        source: 'auto' as const,
      },
    ],
    blankCount: 0,
    distinctCount: 1,
    truncated: false,
  }

  it('start as cash on delivery and are sent that way', () => {
    const list = [...matched, suggestion('paymentMethod', ['Payment'])]
    const form = initialMappingForm(state(list, payment))
    expect(form.payment.instapay).toBe('cod')
    expect(
      toSaveBody(form, { paymentValues: payment, dateFormat: null }).options
        .paymentValueMap
    ).toEqual({ instapay: 'cod' })
  })
})
