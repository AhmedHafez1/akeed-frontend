import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { StorePaidThroughControl } from './StorePaidThroughControl'

const api = vi.hoisted(() => ({ clearAdminStorePaidThrough: vi.fn() }))
vi.mock('./adminApi', () => api)

beforeEach(() => {
  vi.clearAllMocks()
  api.clearAdminStorePaidThrough.mockResolvedValue({})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('StorePaidThroughControl', () => {
  it('renders nothing without a paid-through date', () => {
    const { container } = render(
      <StorePaidThroughControl
        integrationId="int-1"
        paidThroughAt={null}
        onCleared={vi.fn()}
      />
    )
    expect(container.textContent).toBe('')
  })

  it('shows the date and clears it after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onCleared = vi.fn()
    render(
      <StorePaidThroughControl
        integrationId="int-1"
        paidThroughAt="2026-11-30T08:30:00.000Z"
        onCleared={onCleared}
      />
    )

    expect(screen.getByText(/^Paid through /)).toBeTruthy()
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Clear paid-through date' })
      )
    })

    expect(api.clearAdminStorePaidThrough).toHaveBeenCalledWith('int-1')
    expect(onCleared).toHaveBeenCalledTimes(1)
  })

  it('does nothing when staff cancel the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <StorePaidThroughControl
        integrationId="int-1"
        paidThroughAt="2026-11-30T08:30:00.000Z"
        onCleared={vi.fn()}
      />
    )
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Clear paid-through date' })
      )
    })
    expect(api.clearAdminStorePaidThrough).not.toHaveBeenCalled()
  })
})
