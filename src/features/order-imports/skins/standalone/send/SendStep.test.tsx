import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../../../public/messages/en.json'
import type {
  OrderImportBatchDetail,
  OrderImportStartQuote,
} from '../../../api/orderImportsApi'
import { useSendStep } from '../../../domain/useSendStep'
import { SendStep } from './SendStep'

vi.mock('../../../api/orderImportQueries', () => ({
  orderImportAllRowsOptions: (batchId: string) => ({
    queryKey: ['order-import-rows', batchId],
    queryFn: async () => ({ rows: [] }),
  }),
}))

vi.mock('../../../domain/useSendStep', () => ({
  useSendStep: vi.fn(),
}))

vi.mock('@/shared/ui', () => ({
  Button: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  DialogClose: ({ children }: { children: ReactNode }) => <>{children}</>,
  LoadingButton: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  Progress: () => <progress />,
  Skeleton: () => <div data-testid="skeleton" />,
}))

vi.mock('../ImportNotice', () => ({
  ImportNotice: ({
    children,
    role,
    title,
  }: {
    children?: ReactNode
    role?: string
    title?: string
  }) => (
    <div role={role}>
      {title}
      {children}
    </div>
  ),
}))

vi.mock('../modal/ModalStepLayout', () => ({
  ModalStepLayout: ({
    children,
    footer,
  }: {
    children: ReactNode
    footer?: ReactNode
  }) => (
    <section>
      {children}
      <footer>{footer}</footer>
    </section>
  ),
}))

vi.mock('./CostStrip', () => ({ CostStrip: () => null }))
vi.mock('./ReadyPreview', () => ({ ReadyPreview: () => null }))
vi.mock('./SkippedLines', () => ({ SkippedLines: () => null }))

const BATCH = '0b8f7a52-6c1e-4f5e-9a39-2d6c1f0e7b11'

function detail(
  status: OrderImportBatchDetail['status'],
  counts: OrderImportBatchDetail['counts']
): OrderImportBatchDetail {
  return {
    batchId: BATCH,
    status,
    fileName: 'orders.csv',
    counts,
    permissions: { canEdit: true },
  } as OrderImportBatchDetail
}

function quote(orders: number): OrderImportStartQuote {
  return {
    batchId: BATCH,
    orders,
    accountingMode: 'prepaid_credit',
    creditsAvailable: 457,
    slotsRemaining: null,
    estimatedCreditsMin: orders,
    estimatedCreditsMax: orders,
    ratePerMinute: 20,
    estimatedDurationMinutes: 1,
    quietHours: { enabled: false, start: null, end: null, timezone: 'UTC' },
    startDeadlineAt: null,
    blockers: [],
    quoteToken: 'draft-token',
    quoteExpiresAt: '2026-09-25T10:10:00Z',
  }
}

function sendState(phase: string, orders: number) {
  return {
    phase,
    quote: { data: quote(orders) },
    imported: false,
    notice: null,
    canSend: false,
    sendBlocked: false,
    submit: vi.fn(),
  } as unknown as ReturnType<typeof useSendStep>
}

function renderStep(batch: OrderImportBatchDetail) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en}>
        <SendStep detail={batch} canEdit onBack={vi.fn()} onDone={vi.fn()} />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('SendStep empty-ready message', () => {
  it('shows the warning for a draft with no ready orders', () => {
    vi.mocked(useSendStep).mockReturnValue(sendState('review', 0))
    renderStep(detail('draft', { ready: 0 }))

    expect(screen.getByText(en.orderImport.send.nothingReady)).toBeTruthy()
  })

  it('shows the quoted count and progress after import starts', () => {
    vi.mocked(useSendStep).mockReturnValue(sendState('importing', 13))
    renderStep(detail('committing', { ready: 0, readyAtCommit: 13 }))

    expect(screen.queryByText(en.orderImport.send.nothingReady)).toBeNull()
    const heroHeading = screen.getByText(
      (_content, element) =>
        element?.tagName === 'P' &&
        element.textContent?.includes('orders ready to confirm on WhatsApp') ===
          true
    )
    expect(heroHeading.textContent).toContain('13')
    expect(screen.getByText(en.orderImport.send.importing)).toBeTruthy()
  })
})
