import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AdminStoreReviewPrompt } from './admin.model'
import { StoreReviewPromptCard } from './StoreReviewPromptCard'

const auth = vi.hoisted(() => ({ fetchWithAuth: vi.fn() }))

vi.mock('@/shared/lib/auth', () => auth)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function prompt(
  overrides: Partial<AdminStoreReviewPrompt> = {}
): AdminStoreReviewPrompt {
  return {
    enabled: false,
    request_id: null,
    enabled_at: null,
    enabled_by: null,
    opted_out: false,
    opted_out_at: null,
    last_event: null,
    events: [],
    ...overrides,
  }
}

const reviewSwitch = () =>
  screen.getByRole('switch', { name: 'Review Prompt Enabled' })

describe('StoreReviewPromptCard', () => {
  beforeEach(() => auth.fetchWithAuth.mockReset())

  it('turns the request on through the PATCH endpoint', async () => {
    const enabled = prompt({
      enabled: true,
      request_id: 'req-1',
      enabled_at: '2026-10-19T09:00:00Z',
      enabled_by: 'staff@akeed.test',
      last_event: {
        event: 'enabled',
        actor_type: 'admin',
        at: '2026-10-19T09:00:00Z',
      },
      events: [
        {
          id: 'e-1',
          request_id: 'req-1',
          event: 'enabled',
          actor_type: 'admin',
          actor_id: 'staff-1',
          at: '2026-10-19T09:00:00Z',
        },
      ],
    })
    auth.fetchWithAuth.mockResolvedValue(json(200, { review_prompt: enabled }))
    render(<StoreReviewPromptCard integrationId="int 1" initial={prompt()} />)
    expect(screen.getByText('Off')).toBeTruthy()

    fireEvent.click(reviewSwitch())

    await waitFor(() =>
      expect(reviewSwitch().getAttribute('aria-checked')).toBe('true')
    )
    const [url, init] = auth.fetchWithAuth.mock.calls[0]
    expect(url).toBe('/api/admin/stores/int%201/review-prompt')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ enabled: true })
    expect(screen.getByText('On')).toBeTruthy()
    expect(screen.getByText(/Turned on by admin/)).toBeTruthy()
  })

  it('locks the switch and says why once the merchant opted out', () => {
    render(
      <StoreReviewPromptCard
        integrationId="int-1"
        initial={prompt({
          opted_out: true,
          opted_out_at: '2026-10-18T12:00:00Z',
        })}
      />
    )
    expect(reviewSwitch().hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('Opted out')).toBeTruthy()
    expect(screen.getByText(/so the switch stays off/)).toBeTruthy()
    fireEvent.click(reviewSwitch())
    expect(auth.fetchWithAuth).not.toHaveBeenCalled()
  })

  it('locks the switch when the backend reports an opt-out', async () => {
    auth.fetchWithAuth.mockResolvedValue(
      json(409, { message: 'Opted out', code: 'REVIEW_PROMPT_OPTED_OUT' })
    )
    render(<StoreReviewPromptCard integrationId="int-1" initial={prompt()} />)
    fireEvent.click(reviewSwitch())
    await waitFor(() =>
      expect(reviewSwitch().hasAttribute('disabled')).toBe(true)
    )
    expect(screen.getByText('Opted out')).toBeTruthy()
  })

  it('shows where the merchant stands and what they would see', () => {
    render(
      <StoreReviewPromptCard
        integrationId="int-1"
        initial={prompt({
          enabled: true,
          state: 'snoozed',
          snoozed_until: '2026-11-02T09:00:00Z',
          snooze_count: 1,
          shown_count: 4,
          last_shown_at: '2026-10-19T09:00:00Z',
          last_result_code: 'cancelled',
          preview: {
            variant: 'results',
            confirmed: 42,
            canceled: 3,
            since: '2026-03-15T09:00:00Z',
          },
        })}
      />
    )
    expect(screen.getByText(/^Snoozed until/)).toBeTruthy()
    expect(
      screen.getByText(/^Results: 42 confirmed, 3 canceled since/)
    ).toBeTruthy()
    expect(screen.getByText(/^4 · last/)).toBeTruthy()
    expect(screen.getByText('cancelled')).toBeTruthy()
  })

  it('describes the plain request when there are too few results', () => {
    render(
      <StoreReviewPromptCard
        integrationId="int-1"
        initial={prompt({
          state: 'eligible',
          preview: {
            variant: 'fallback',
            confirmed: 4,
            canceled: 0,
            since: null,
          },
        })}
      />
    )
    expect(screen.getByText(/^Plain request/)).toBeTruthy()
    // An eligible store has nothing to reset.
    expect(screen.queryByRole('button', { name: 'Reset prompt' })).toBeNull()
  })

  it('resets a declined store through the reset endpoint', async () => {
    const reset = prompt({ state: 'eligible', snooze_count: 0 })
    auth.fetchWithAuth.mockResolvedValue(json(200, { review_prompt: reset }))
    render(
      <StoreReviewPromptCard
        integrationId="int 1"
        initial={prompt({
          state: 'declined',
          opted_out: true,
          snooze_count: 2,
        })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset prompt' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Reset prompt' })).toBeNull()
    )
    const [url, init] = auth.fetchWithAuth.mock.calls[0]
    expect(url).toBe('/api/admin/stores/int%201/review-prompt/reset')
    expect(init.method).toBe('POST')
    expect(screen.getByText('Eligible')).toBeTruthy()
    expect(reviewSwitch().hasAttribute('disabled')).toBe(false)
  })

  it('keeps the card and offers a retry when the reset fails', async () => {
    auth.fetchWithAuth.mockResolvedValue(
      json(503, { message: 'Admin service unavailable' })
    )
    render(
      <StoreReviewPromptCard
        integrationId="int-1"
        initial={prompt({ state: 'clicked' })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset prompt' }))
    expect(await screen.findByText('Admin service unavailable')).toBeTruthy()
    expect(screen.getByText('Clicked')).toBeTruthy()
  })
})
