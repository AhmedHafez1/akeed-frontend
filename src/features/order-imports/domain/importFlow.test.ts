import { describe, expect, it } from 'vitest'
import {
  flowFromBatch,
  flowReducer,
  initialFlow,
  type FlowEvent,
  type FlowState,
} from './importFlow'

const run = (events: FlowEvent[], from: FlowState = initialFlow) =>
  events.reduce(flowReducer, from)

describe('flowReducer', () => {
  it('walks the happy path to sending', () => {
    const state = run([
      { type: 'fileChosen' },
      { type: 'checkOpened', allMatched: true },
      { type: 'mappingSaved' },
      { type: 'import', send: true },
      { type: 'imported' },
    ])
    expect(state.phase).toBe('sending')
  })

  it('stops after importing when the merchant chose "import only"', () => {
    const state = run([
      { type: 'fileChosen' },
      { type: 'checkOpened', allMatched: true },
      { type: 'mappingSaved' },
      { type: 'import', send: false },
      { type: 'imported' },
    ])
    expect(state).toMatchObject({ phase: 'review', sendAfterImport: false })
  })

  it('opens the check collapsed only when everything matched', () => {
    expect(run([{ type: 'checkOpened', allMatched: true }])).toMatchObject({
      phase: 'check',
      mappingOpen: false,
      paymentOpen: true,
    })
    expect(run([{ type: 'checkOpened', allMatched: false }])).toMatchObject({
      mappingOpen: true,
      paymentOpen: false,
    })
  })

  it('opens the folded panels on request', () => {
    const state = run([
      { type: 'checkOpened', allMatched: false },
      { type: 'editPayment' },
    ])
    expect(state.paymentOpen).toBe(true)
    expect(
      run([{ type: 'checkOpened', allMatched: true }, { type: 'editMapping' }])
        .mappingOpen
    ).toBe(true)
  })

  it('goes back from review to an open mapping', () => {
    const state = run([
      { type: 'checkOpened', allMatched: true },
      { type: 'mappingSaved' },
      { type: 'backToCheck' },
    ])
    expect(state).toMatchObject({ phase: 'check', mappingOpen: true })
  })

  it('returns to idle when the upload fails, and to review on a failed import', () => {
    expect(run([{ type: 'fileChosen' }, { type: 'uploadFailed' }]).phase).toBe(
      'idle'
    )
    const failed = run([
      { type: 'checkOpened', allMatched: true },
      { type: 'mappingSaved' },
      { type: 'import', send: true },
      { type: 'importFailed' },
    ])
    expect(failed).toMatchObject({ phase: 'review', sendAfterImport: false })
  })

  it('ignores events that do not fit the phase', () => {
    expect(run([{ type: 'import', send: true }])).toBe(initialFlow)
    expect(run([{ type: 'mappingSaved' }])).toBe(initialFlow)
  })
})

describe('flowFromBatch', () => {
  it('resumes each server status on its step', () => {
    expect(
      flowFromBatch({ status: 'draft', mappingConfirmed: false }, false)
    ).toMatchObject({ phase: 'check', mappingOpen: true })
    expect(
      flowFromBatch({ status: 'draft', mappingConfirmed: true }, true).phase
    ).toBe('review')
    expect(
      flowFromBatch({ status: 'committing', mappingConfirmed: true }, true)
        .phase
    ).toBe('importing')
    expect(
      flowFromBatch({ status: 'releasing', mappingConfirmed: true }, true).phase
    ).toBe('sending')
  })
})
