import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import type { CapacitySummary } from '../model/dashboard.model'
import { useConfirmationsList } from '../domain/useConfirmationsList'
import { renderEmbedded } from './embedded/components/embeddedTestUtils'
import { renderStandalone } from './standalone/components/shared/standaloneTestUtils'
import { ConfirmationsEmbedded } from './embedded/ConfirmationsEmbedded'
import { DashboardVerificationsStandaloneSkin } from './standalone/DashboardVerificationsStandaloneSkin'

vi.mock('../domain/useConfirmationsList', () => ({
  useConfirmationsList: vi.fn(),
}))
vi.mock('../domain/useConfirmationsExport', () => ({
  exportErrorKey: () => 'error',
  useConfirmationsExport: () => ({
    exportList: vi.fn(),
    isExporting: false,
  }),
}))
vi.mock('../domain/useManualConfirmation', () => ({
  useManualConfirmation: () => ({
    target: null,
    isConfirming: false,
    feedback: null,
    request: vi.fn(),
    dismiss: vi.fn(),
    confirm: vi.fn(),
    dismissFeedback: vi.fn(),
  }),
}))
vi.mock('../domain/useOutcomeSyncRetry', () => ({
  useOutcomeSyncRetry: () => ({ retryingId: null, retry: vi.fn() }),
}))
vi.mock('@/features/billing', () => ({
  UpgradePlansModal: () => null,
}))

const blocked: CapacitySummary = {
  blocked_count: 4,
  mode: 'plan',
  remaining: 0,
  action: 'upgrade',
  reset_at: '2026-11-01T00:00:00.000Z',
}

function listState(capacity: CapacitySummary | null) {
  return {
    rows: [],
    total: 0,
    tabCounts: null,
    reportingTimezone: 'UTC',
    sourceStatus: 'connected',
    settings: null,
    capacity,
    creditDenialCode: null,
    canWrite: true,
    canRetry: true,
    canSendTest: false,
    isLoading: false,
    isFetching: false,
    isError: false,
    retry: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: vi.fn(),
    searchInput: '',
    search: '',
    isSearchValid: true,
    onSearchChange: vi.fn(),
    onSearchClear: vi.fn(),
    actingId: null,
    onRetry: vi.fn(),

    onToggleAutoCancel: vi.fn(),
    onCancel: vi.fn(),
  } as unknown as ReturnType<typeof useConfirmationsList>
}

const shared = {
  period: 'last_30_days' as const,
  periodOptions: [],
  onPeriodChange: vi.fn(),
  tab: 'all' as const,
  onTabChange: vi.fn(),
}

describe('blocked-orders warning on the confirmations list', () => {
  it('shows on the standalone list while orders wait', () => {
    vi.mocked(useConfirmationsList).mockReturnValue(listState(blocked))

    renderStandalone(<DashboardVerificationsStandaloneSkin {...shared} />, 'en')

    expect(screen.getByText('Orders waiting to be sent: 4')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Upgrade plan' }).getAttribute('href')
    ).toBe('/en/billing')
  })

  it('shows on the embedded list while orders wait', () => {
    vi.mocked(useConfirmationsList).mockReturnValue(listState(blocked))

    renderEmbedded(<ConfirmationsEmbedded {...shared} />, 'en')

    expect(screen.getByText('Orders waiting to be sent: 4')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upgrade plan' })).toBeTruthy()
  })

  it('stays hidden in both modes when nothing is blocked', () => {
    vi.mocked(useConfirmationsList).mockReturnValue(
      listState({ ...blocked, blocked_count: 0 })
    )

    renderStandalone(<DashboardVerificationsStandaloneSkin {...shared} />, 'en')
    renderEmbedded(<ConfirmationsEmbedded {...shared} />, 'en')

    expect(screen.queryByText(/Orders waiting to be sent/)).toBeNull()
  })
})
