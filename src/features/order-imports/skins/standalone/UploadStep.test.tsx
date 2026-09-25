import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { Dialog } from '@/shared/ui'
import en from '../../../../../public/messages/en.json'
import type { OrderImportDraftList } from '../../api/orderImportsApi'
import { describeFileError } from '../../domain/fileErrors'
import { ImportNewContent } from './modal/ImportModalContent'

const withDraft = {
  isPending: false,
  error: null,
  data: {
    drafts: [
      {
        batchId: '0b8f7a52-6c1e-4f5e-9a39-2d6c1f0e7b11',
        fileName: 'akeed-orders-temp-1.xlsx',
        rowCount: 8,
        createdAt: '2026-09-25T09:00:00.000Z',
        expiresAt: '2026-09-26T09:00:00.000Z',
      },
    ],
    permissions: { canEdit: true },
  },
} as unknown as UseQueryResult<OrderImportDraftList>

describe('upload step', () => {
  it('starts fresh even when an open draft exists', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <NextIntlClientProvider locale="en" messages={en}>
          {/* The step's Cancel is a DialogClose. */}
          <Dialog open>
            <ImportNewContent
              availability="enabled"
              drafts={withDraft}
              onUploaded={() => undefined}
            />
          </Dialog>
        </NextIntlClientProvider>
      </QueryClientProvider>
    )

    expect(screen.getByTestId('order-import-dropzone')).toBeTruthy()
    expect(screen.queryByText('akeed-orders-temp-1.xlsx')).toBeNull()
    expect(screen.queryByRole('button', { name: /continue/i })).toBeNull()
    expect(
      screen.queryByRole('region', { name: /where you left off/i })
    ).toBeNull()
  })

  it('offers a retry, not a drafts list, when the team fills the draft cap', () => {
    expect(describeFileError('IMPORT_TOO_MANY_DRAFTS')).toEqual({
      key: 'IMPORT_TOO_MANY_DRAFTS',
      action: 'retry',
      showReference: false,
    })
  })
})
