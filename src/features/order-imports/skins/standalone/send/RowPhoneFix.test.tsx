import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { ApiError } from '@/shared/lib/http'
import en from '../../../../../../public/messages/en.json'
import type { OrderImportRow } from '../../../api/orderImportsApi'
import { hasPhoneIssue, RowPhoneFix } from './RowPhoneFix'

const api = vi.hoisted(() => ({ fixOrderImportRowPhone: vi.fn() }))

vi.mock('../../../api/orderImportsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/orderImportsApi')>()),
  ...api,
}))

const BATCH = '0b8f7a52-6c1e-4f5e-9a39-2d6c1f0e7b11'

const row: OrderImportRow = {
  rowNumber: 4,
  raw: { phone: '12', customerName: 'Ahmed' },
  normalized: null,
  outcome: 'invalid',
  issues: [{ code: 'PHONE_INVALID', field: 'phone' }],
  includeOverride: false,
  collapsedInto: null,
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en}>
        <RowPhoneFix batchId={BATCH} row={row} />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
  const input = screen.getByLabelText('New phone number for row 4')
  const save = screen.getByRole('button', { name: 'Save' })
  return { input, save }
}

beforeEach(() => vi.clearAllMocks())

describe('hasPhoneIssue', () => {
  it('is true only for a phone issue that counts', () => {
    expect(hasPhoneIssue(row)).toBe(true)
    expect(
      hasPhoneIssue({
        ...row,
        issues: [
          { code: 'FIELD_TOO_LONG', field: 'phone', informational: true },
        ],
      })
    ).toBe(false)
    expect(
      hasPhoneIssue({
        ...row,
        issues: [{ code: 'AMOUNT_INVALID', field: 'amount' }],
      })
    ).toBe(false)
  })
})

describe('RowPhoneFix', () => {
  it('sends the typed number for the row', async () => {
    api.fixOrderImportRowPhone.mockResolvedValue({
      row: { ...row, outcome: 'ready', issues: [] },
      counts: { ready: 1 },
    })
    const { input, save } = setup()
    expect(save.hasAttribute('disabled')).toBe(true)
    fireEvent.change(input, { target: { value: ' 01012345678 ' } })
    fireEvent.click(save)
    await waitFor(() =>
      expect(api.fixOrderImportRowPhone).toHaveBeenCalledWith(
        BATCH,
        4,
        '01012345678'
      )
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says why the server refused the number', async () => {
    api.fixOrderImportRowPhone.mockRejectedValue(
      Object.assign(new ApiError('bad', 422, 'IMPORT_ROW_PHONE_INVALID'), {
        issue: 'PHONE_NOT_MOBILE',
      })
    )
    const { input, save } = setup()
    fireEvent.change(input, { target: { value: '0223456789' } })
    fireEvent.click(save)
    expect((await screen.findByRole('alert')).textContent).toBe(
      en.orderImport.issues.PHONE_NOT_MOBILE
    )
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('falls back to a generic failure', async () => {
    api.fixOrderImportRowPhone.mockRejectedValue(new Error('offline'))
    const { input, save } = setup()
    fireEvent.change(input, { target: { value: '01012345678' } })
    fireEvent.click(save)
    expect((await screen.findByRole('alert')).textContent).toBe(
      en.orderImport.send.phoneFix.failed
    )
  })
})
