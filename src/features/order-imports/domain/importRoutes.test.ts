import { describe, expect, it } from 'vitest'
import {
  importModalPath,
  readImportTarget,
  withImportTarget,
} from './importRoutes'

const batchId = '0b8f7a52-6c1e-4f5e-9a39-2d6c1f0e7b11'

describe('readImportTarget', () => {
  it('reads a new import and a batch', () => {
    expect(readImportTarget(new URLSearchParams('import=new'))).toEqual({
      kind: 'new',
    })
    expect(readImportTarget(new URLSearchParams(`import=${batchId}`))).toEqual({
      kind: 'batch',
      batchId,
    })
  })

  it('treats anything else as closed', () => {
    expect(readImportTarget(new URLSearchParams(''))).toBeNull()
    expect(readImportTarget(new URLSearchParams('import=../x'))).toBeNull()
  })
})

describe('withImportTarget', () => {
  it('keeps the list filters while opening and closing', () => {
    const opened = withImportTarget('status=failed', { kind: 'new' })
    expect(opened).toBe('?status=failed&import=new')
    expect(withImportTarget(opened.slice(1), null)).toBe('?status=failed')
  })

  it('drops the start flag unless asked for on a batch', () => {
    expect(
      withImportTarget(`import=${batchId}&start=1`, { kind: 'batch', batchId })
    ).toBe(`?import=${batchId}`)
    expect(
      withImportTarget('', { kind: 'batch', batchId }, { start: true })
    ).toBe(`?import=${batchId}&start=1`)
    expect(withImportTarget('', null)).toBe('')
    expect(
      withImportTarget(`status=failed&import=${batchId}&outcome=invalid`, null)
    ).toBe('?status=failed')
  })
})

describe('importModalPath', () => {
  it('points at Verifications with the modal open', () => {
    expect(importModalPath('new')).toBe('/verifications?import=new')
    expect(importModalPath(batchId, { start: true })).toBe(
      `/verifications?import=${batchId}&start=1`
    )
  })
})
